import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Lease, Payment, Prisma } from '@prisma/client';
import { PaymentEventType, PaymentStatus, PaymentType } from '../../common/constants/domain-enums';
import { serializeJson } from '../../common/utils/db-json';
import { PrismaService } from '../../prisma/prisma.service';
import { AddPaymentMethodDto } from './dto/add-payment-method.dto';
import { PayDto } from './dto/pay.dto';
import {
  PAYMENT_PROVIDER,
  PaymentProvider,
} from './providers/payment-provider.interface';

const PROVIDER_NAME = 'stripe_mock';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {}

  // ────────────────────────────────────────────────
  // Lease-driven payment creation
  // ────────────────────────────────────────────────

  async createInitialPaymentsForLease(lease: Lease) {
    const deposit = await this.prisma.payment.create({
      data: {
        leaseId: lease.id,
        payerId: lease.tenantId,
        type: PaymentType.DEPOSIT,
        status: PaymentStatus.PENDING,
        amount: lease.depositAmount,
        currency: lease.currency,
        dueDate: lease.startDate,
      },
    });

    await this.prisma.paymentEvent.create({
      data: {
        paymentId: deposit.id,
        eventType: PaymentEventType.CREATED,
        message: 'Deposit payment created from lease',
      },
    });

    this.eventEmitter.emit('payment.created', {
      paymentId: deposit.id,
      leaseId: lease.id,
      payerId: deposit.payerId,
      amount: deposit.amount,
      type: deposit.type,
    });

    const firstRentDue = this.computeFirstRentDueDate(
      lease.startDate,
      lease.dueDay,
    );

    const rent = await this.prisma.payment.create({
      data: {
        leaseId: lease.id,
        payerId: lease.tenantId,
        type: PaymentType.RENT,
        status: PaymentStatus.PENDING,
        amount: lease.monthlyAmount,
        currency: lease.currency,
        dueDate: firstRentDue,
      },
    });

    await this.prisma.paymentEvent.create({
      data: {
        paymentId: rent.id,
        eventType: PaymentEventType.CREATED,
        message: 'First rent payment created from lease',
      },
    });

    this.eventEmitter.emit('payment.created', {
      paymentId: rent.id,
      leaseId: lease.id,
      payerId: rent.payerId,
      amount: rent.amount,
      type: rent.type,
    });

    return { deposit, rent };
  }

  // ────────────────────────────────────────────────
  // Queries
  // ────────────────────────────────────────────────

  async listForLease(leaseId: string, userId: string) {
    const lease = await this.prisma.lease.findUnique({
      where: { id: leaseId },
      select: { id: true, tenantId: true, landlordId: true },
    });
    if (!lease) throw new NotFoundException(`Lease ${leaseId} not found`);
    this.assertLeaseAccess(lease, userId);

    return this.prisma.payment.findMany({
      where: { leaseId },
      include: { transactions: true, events: true },
      orderBy: { dueDate: 'asc' },
    });
  }

  async findById(paymentId: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        lease: { select: { id: true, tenantId: true, landlordId: true } },
        transactions: true,
        events: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!payment) throw new NotFoundException(`Payment ${paymentId} not found`);
    this.assertLeaseAccess(payment.lease, userId);
    return payment;
  }

  // ────────────────────────────────────────────────
  // Pay flow
  // ────────────────────────────────────────────────

  async pay(paymentId: string, userId: string, dto: PayDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { lease: true, paymentMethod: true },
    });
    if (!payment) throw new NotFoundException(`Payment ${paymentId} not found`);
    if (payment.payerId !== userId) {
      throw new ForbiddenException('Only the payer can pay this payment');
    }
    if (
      payment.status !== PaymentStatus.PENDING &&
      payment.status !== PaymentStatus.LATE
    ) {
      throw new BadRequestException(
        `Payment cannot be paid from status ${payment.status}`,
      );
    }

    // Resolve payment method.
    let methodType = dto.methodType ?? 'card';
    let paymentMethodId = dto.paymentMethodId ?? payment.paymentMethodId ?? undefined;
    if (paymentMethodId) {
      const pm = await this.prisma.paymentMethod.findUnique({
        where: { id: paymentMethodId },
      });
      if (!pm || pm.userId !== userId) {
        throw new ForbiddenException('Invalid payment method');
      }
      if (!dto.methodType) {
        methodType = pm.type.toLowerCase();
      }
    }

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.PROCESSING,
        paymentMethodId: paymentMethodId ?? null,
      },
    });

    await this.prisma.paymentEvent.create({
      data: {
        paymentId,
        eventType: PaymentEventType.PROCESSING,
        message: 'Charging provider',
      },
    });

    const result = await this.provider.charge({
      paymentId,
      amount: payment.amount,
      currency: payment.currency,
      methodType,
    });

    const transaction = await this.prisma.paymentTransaction.create({
      data: {
        paymentId,
        provider: PROVIDER_NAME,
        providerRef: result.providerRef,
        amount: payment.amount,
        currency: payment.currency,
        success: result.success,
        rawResponse: serializeJson(result.raw ?? {}),
      },
    });

    if (result.success) {
      const updated = await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.PAID,
          paidAt: new Date(),
        },
      });

      await this.prisma.paymentEvent.create({
        data: {
          paymentId,
          transactionId: transaction.id,
          eventType: PaymentEventType.SUCCEEDED,
          message: result.message ?? 'Payment succeeded',
        },
      });

      this.eventEmitter.emit('payment.paid', {
        paymentId,
        leaseId: payment.leaseId,
        payerId: payment.payerId,
        amount: payment.amount,
      });

      return updated;
    }

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.FAILED },
    });

    await this.prisma.paymentEvent.create({
      data: {
        paymentId,
        transactionId: transaction.id,
        eventType: PaymentEventType.FAILED,
        message: result.message ?? 'Payment failed',
      },
    });

    this.eventEmitter.emit('payment.failed', {
      paymentId,
      leaseId: payment.leaseId,
      payerId: payment.payerId,
      amount: payment.amount,
      reason: result.message ?? 'Provider declined',
    });

    return updated;
  }

  // ────────────────────────────────────────────────
  // Test helpers
  // ────────────────────────────────────────────────

  async simulateSuccess(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) throw new NotFoundException(`Payment ${paymentId} not found`);

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.PAID, paidAt: new Date() },
    });

    await this.prisma.paymentEvent.create({
      data: {
        paymentId,
        eventType: PaymentEventType.SUCCEEDED,
        message: 'Simulated success',
      },
    });

    this.eventEmitter.emit('payment.paid', {
      paymentId,
      leaseId: payment.leaseId,
      payerId: payment.payerId,
      amount: payment.amount,
      simulated: true,
    });

    return updated;
  }

  async simulateFailure(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) throw new NotFoundException(`Payment ${paymentId} not found`);

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.FAILED },
    });

    await this.prisma.paymentEvent.create({
      data: {
        paymentId,
        eventType: PaymentEventType.FAILED,
        message: 'Simulated failure',
      },
    });

    this.eventEmitter.emit('payment.failed', {
      paymentId,
      leaseId: payment.leaseId,
      payerId: payment.payerId,
      amount: payment.amount,
      reason: 'Simulated failure',
      simulated: true,
    });

    return updated;
  }

  // ────────────────────────────────────────────────
  // Payment methods
  // ────────────────────────────────────────────────

  async addPaymentMethod(userId: string, dto: AddPaymentMethodDto) {
    return this.prisma.$transaction(async (tx) => {
      const existingCount = await tx.paymentMethod.count({ where: { userId } });
      const shouldBeDefault =
        existingCount === 0 ? true : dto.isDefault === true;

      if (shouldBeDefault) {
        await tx.paymentMethod.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.paymentMethod.create({
        data: {
          userId,
          type: dto.type,
          brand: dto.brand,
          last4: dto.last4,
          isDefault: shouldBeDefault,
        },
      });
    });
  }

  async listPaymentMethods(userId: string) {
    return this.prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async removePaymentMethod(userId: string, methodId: string) {
    const method = await this.prisma.paymentMethod.findUnique({
      where: { id: methodId },
    });
    if (!method) throw new NotFoundException(`Payment method ${methodId} not found`);
    if (method.userId !== userId) {
      throw new ForbiddenException('Not your payment method');
    }

    await this.prisma.paymentMethod.delete({ where: { id: methodId } });

    if (method.isDefault) {
      const next = await this.prisma.paymentMethod.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (next) {
        await this.prisma.paymentMethod.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }

    return { removed: true, id: methodId };
  }

  // ────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────

  private assertLeaseAccess(
    lease: { tenantId: string; landlordId: string },
    userId: string,
  ) {
    if (lease.tenantId !== userId && lease.landlordId !== userId) {
      throw new ForbiddenException('No access to this lease/payment');
    }
  }

  private computeFirstRentDueDate(startDate: Date, dueDay: number): Date {
    const start = new Date(startDate);
    const year = start.getUTCFullYear();
    const month = start.getUTCMonth();
    const day = Math.min(Math.max(dueDay, 1), 28);

    let candidate = new Date(Date.UTC(year, month, day, 0, 0, 0));
    if (candidate <= start) {
      candidate = new Date(Date.UTC(year, month + 1, day, 0, 0, 0));
    }
    return candidate;
  }
}

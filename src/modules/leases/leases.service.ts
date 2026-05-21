import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { LeaseStatus, MatchStatus } from '../../common/constants/domain-enums';
import { serializeJson } from '../../common/utils/db-json';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateLeaseDto } from './dto/create-lease.dto';

@Injectable()
export class LeasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateLeaseDto, actorId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: dto.matchId },
      include: {
        tenant: true,
        landlord: true,
        property: true,
        lease: true,
      },
    });

    if (!match) throw new NotFoundException(`Match ${dto.matchId} not found`);
    if (match.landlordId !== actorId) {
      throw new ForbiddenException('Only the landlord can create a lease');
    }
    const eligibleMatchStatuses: MatchStatus[] = [MatchStatus.PENDING, MatchStatus.ACTIVE];
    const matchStatus = match.status as MatchStatus;
    if (!eligibleMatchStatuses.includes(matchStatus)) {
      throw new BadRequestException(
        `Match status ${match.status} is not eligible for lease creation`,
      );
    }
    if (match.lease) {
      throw new BadRequestException('A lease already exists for this match');
    }
    if (dto.endDate && dto.endDate <= dto.startDate) {
      throw new BadRequestException('endDate must be after startDate');
    }

    const lease = await this.prisma.lease.create({
      data: {
        matchId: match.id,
        propertyId: match.propertyId,
        tenantId: match.tenantId,
        landlordId: match.landlordId,
        status: LeaseStatus.DRAFT,
        monthlyAmount: dto.monthlyAmount,
        depositAmount: dto.depositAmount,
        currency: dto.currency ?? match.property.currency ?? 'USD',
        dueDay: dto.dueDay ?? 1,
        startDate: dto.startDate,
        endDate: dto.endDate,
        schedule: serializeJson(dto.schedule),
      },
    });

    await this.prisma.match.update({
      where: { id: match.id },
      data: { status: MatchStatus.CONVERTED_TO_LEASE },
    });

    await this.paymentsService.createInitialPaymentsForLease(lease);

    this.eventEmitter.emit('lease.created', {
      leaseId: lease.id,
      tenantId: lease.tenantId,
      landlordId: lease.landlordId,
      propertyId: lease.propertyId,
    });

    return lease;
  }

  async updateStatus(
    leaseId: string,
    actorId: string,
    newStatus: LeaseStatus,
  ) {
    const lease = await this.prisma.lease.findUnique({
      where: { id: leaseId },
    });
    if (!lease) throw new NotFoundException(`Lease ${leaseId} not found`);
    if (lease.tenantId !== actorId && lease.landlordId !== actorId) {
      throw new ForbiddenException('Not a party of this lease');
    }

    const currentStatus = lease.status as LeaseStatus;
    if (!this.isValidTransition(currentStatus, newStatus)) {
      throw new BadRequestException(
        `Invalid status transition: ${lease.status} → ${newStatus}`,
      );
    }

    const updated = await this.prisma.lease.update({
      where: { id: leaseId },
      data: { status: newStatus },
    });

    this.eventEmitter.emit('lease.status_changed', {
      leaseId: updated.id,
      previousStatus: lease.status,
      newStatus: updated.status,
      actorId,
    });

    return updated;
  }

  async findById(leaseId: string, userId: string) {
    const lease = await this.prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        property: true,
        tenant: { select: { id: true, fullName: true, avatarUrl: true } },
        landlord: { select: { id: true, fullName: true, avatarUrl: true } },
        payments: {
          orderBy: { dueDate: 'asc' },
        },
      },
    });
    if (!lease) throw new NotFoundException(`Lease ${leaseId} not found`);
    if (lease.tenantId !== userId && lease.landlordId !== userId) {
      throw new ForbiddenException('No access to this lease');
    }
    return lease;
  }

  async findForUser(userId: string) {
    return this.prisma.lease.findMany({
      where: {
        OR: [{ tenantId: userId }, { landlordId: userId }],
      },
      include: {
        property: { select: { id: true, title: true, city: true } },
        tenant: { select: { id: true, fullName: true } },
        landlord: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private isValidTransition(from: LeaseStatus, to: LeaseStatus): boolean {
    if (from === to) return false;
    const allowed: Record<LeaseStatus, LeaseStatus[]> = {
      [LeaseStatus.DRAFT]: [LeaseStatus.ACTIVE, LeaseStatus.CANCELLED],
      [LeaseStatus.ACTIVE]: [
        LeaseStatus.COMPLETED,
        LeaseStatus.TERMINATED,
        LeaseStatus.CANCELLED,
      ],
      [LeaseStatus.COMPLETED]: [],
      [LeaseStatus.CANCELLED]: [],
      [LeaseStatus.TERMINATED]: [],
    };
    return allowed[from]?.includes(to) ?? false;
  }
}

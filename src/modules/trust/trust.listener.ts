import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TrustEventType } from '../../common/constants/domain-enums';
import { TrustService } from './trust.service';

interface PaymentEventPayload {
  payerId?: string;
  paymentId?: string;
  leaseId?: string;
  amount?: number;
}

@Injectable()
export class TrustListener {
  private readonly logger = new Logger(TrustListener.name);

  constructor(private readonly trustService: TrustService) {}

  @OnEvent('payment.paid', { async: true })
  async handlePaymentPaid(payload: PaymentEventPayload): Promise<void> {
    if (!payload?.payerId) {
      this.logger.warn('payment.paid received without payerId');
      return;
    }
    try {
      await this.trustService.recordEvent({
        userId: payload.payerId,
        type: TrustEventType.PAYMENT_ON_TIME,
        reason: 'payment_paid',
        metadata: {
          paymentId: payload.paymentId,
          leaseId: payload.leaseId,
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to record PAYMENT_ON_TIME for user ${payload.payerId}: ${(err as Error).message}`,
      );
    }
  }

  @OnEvent('payment.failed', { async: true })
  async handlePaymentFailed(payload: PaymentEventPayload): Promise<void> {
    if (!payload?.payerId) {
      this.logger.warn('payment.failed received without payerId');
      return;
    }
    try {
      await this.trustService.recordEvent({
        userId: payload.payerId,
        type: TrustEventType.PAYMENT_LATE,
        reason: 'payment_failed',
        metadata: {
          paymentId: payload.paymentId,
          leaseId: payload.leaseId,
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to record PAYMENT_LATE for user ${payload.payerId}: ${(err as Error).message}`,
      );
    }
  }
}

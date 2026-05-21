import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditAction } from '../../common/constants/domain-enums';
import { AuditService } from './audit.service';

@Injectable()
export class AuditListener {
  private readonly logger = new Logger(AuditListener.name);

  constructor(private readonly audit: AuditService) {}

  @OnEvent('property.created', { async: true })
  async onPropertyCreated(payload: any) {
    await this.audit.log({
      actorUserId: payload?.actor ?? payload?.landlordId ?? null,
      entityType: 'property',
      entityId: payload?.propertyId ?? null,
      action: AuditAction.PROPERTY_CREATED,
      newValues: payload ?? null,
    });
  }

  @OnEvent('property.updated', { async: true })
  async onPropertyUpdated(payload: any) {
    await this.audit.log({
      actorUserId: payload?.actor ?? payload?.landlordId ?? null,
      entityType: 'property',
      entityId: payload?.propertyId ?? null,
      action: AuditAction.PROPERTY_UPDATED,
      newValues: payload ?? null,
    });
  }

  @OnEvent('swipe.created', { async: true })
  async onSwipeCreated(payload: any) {
    await this.audit.log({
      actorUserId: payload?.userId ?? payload?.actor ?? null,
      entityType: 'swipe',
      entityId: payload?.swipeId ?? null,
      action: AuditAction.SWIPE_CREATED,
      newValues: payload ?? null,
    });
  }

  @OnEvent('match.accepted', { async: true })
  async onMatchAccepted(payload: any) {
    await this.audit.log({
      actorUserId: payload?.actor ?? payload?.userId ?? null,
      entityType: 'match',
      entityId: payload?.matchId ?? null,
      action: AuditAction.MATCH_ACCEPTED,
      newValues: payload ?? null,
    });
  }

  @OnEvent('match.rejected', { async: true })
  async onMatchRejected(payload: any) {
    await this.audit.log({
      actorUserId: payload?.actor ?? payload?.userId ?? null,
      entityType: 'match',
      entityId: payload?.matchId ?? null,
      action: AuditAction.MATCH_REJECTED,
      newValues: payload ?? null,
    });
  }

  @OnEvent('lease.created', { async: true })
  async onLeaseCreated(payload: any) {
    await this.audit.log({
      actorUserId: payload?.actor ?? payload?.landlordId ?? null,
      entityType: 'lease',
      entityId: payload?.leaseId ?? null,
      action: AuditAction.LEASE_CREATED,
      newValues: payload ?? null,
    });
  }

  @OnEvent('payment.created', { async: true })
  async onPaymentCreated(payload: any) {
    await this.audit.log({
      actorUserId: payload?.actor ?? payload?.payerId ?? null,
      entityType: 'payment',
      entityId: payload?.paymentId ?? null,
      action: AuditAction.PAYMENT_CREATED,
      newValues: payload ?? null,
    });
  }

  @OnEvent('payment.paid', { async: true })
  async onPaymentPaid(payload: any) {
    await this.audit.log({
      actorUserId: payload?.actor ?? payload?.payerId ?? null,
      entityType: 'payment',
      entityId: payload?.paymentId ?? null,
      action: AuditAction.PAYMENT_PAID,
      newValues: payload ?? null,
    });
  }

  @OnEvent('payment.failed', { async: true })
  async onPaymentFailed(payload: any) {
    await this.audit.log({
      actorUserId: payload?.actor ?? payload?.payerId ?? null,
      entityType: 'payment',
      entityId: payload?.paymentId ?? null,
      action: AuditAction.PAYMENT_FAILED,
      newValues: payload ?? null,
    });
  }

  @OnEvent('dispute.created', { async: true })
  async onDisputeCreated(payload: any) {
    await this.audit.log({
      actorUserId: payload?.actor ?? payload?.openerId ?? null,
      entityType: 'dispute',
      entityId: payload?.disputeId ?? null,
      action: AuditAction.DISPUTE_CREATED,
      newValues: payload ?? null,
    });
  }

  @OnEvent('dispute.updated', { async: true })
  async onDisputeUpdated(payload: any) {
    if (payload?.status !== 'RESOLVED') return;
    await this.audit.log({
      actorUserId: payload?.actor ?? null,
      entityType: 'dispute',
      entityId: payload?.disputeId ?? null,
      action: AuditAction.DISPUTE_RESOLVED,
      newValues: payload ?? null,
    });
  }

  @OnEvent('trust.score_updated', { async: true })
  async onTrustScoreUpdated(payload: any) {
    await this.audit.log({
      actorUserId: payload?.actor ?? null,
      entityType: 'user',
      entityId: payload?.userId ?? null,
      action: AuditAction.TRUST_SCORE_UPDATED,
      newValues: payload ?? null,
    });
  }

  @OnEvent('service.request_created', { async: true })
  async onServiceRequestCreated(payload: any) {
    await this.audit.log({
      actorUserId: payload?.actor ?? payload?.requesterId ?? null,
      entityType: 'service_request',
      entityId: payload?.requestId ?? null,
      action: AuditAction.SERVICE_REQUEST_CREATED,
      newValues: payload ?? null,
    });
  }

  @OnEvent('ai.question_asked', { async: true })
  async onAiQuestionAsked(payload: any) {
    await this.audit.log({
      actorUserId: payload?.userId ?? null,
      entityType: payload?.scope ?? 'ai',
      entityId: payload?.propertyId ?? payload?.leaseId ?? null,
      action: AuditAction.AI_QUESTION_ASKED,
      newValues: payload ?? null,
    });
  }

  @OnEvent('user.login', { async: true })
  async onUserLogin(payload: any) {
    await this.audit.log({
      actorUserId: payload?.userId ?? null,
      entityType: 'user',
      entityId: payload?.userId ?? null,
      action: AuditAction.USER_LOGIN,
      ipAddress: payload?.ipAddress ?? null,
      userAgent: payload?.userAgent ?? null,
      newValues: payload ?? null,
    });
  }
}

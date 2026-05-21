import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationType } from '../../common/constants/domain-enums';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(private readonly notifications: NotificationsService) {}

  @OnEvent('match.created', { async: true })
  async onMatchCreated(payload: any) {
    if (!payload?.landlordId) return;
    await this.notifications.create({
      userId: payload.landlordId,
      type: NotificationType.MATCH_CREATED,
      title: 'Nuevo match',
      body: 'Tienes un nuevo match en una de tus propiedades.',
      data: {
        matchId: payload.matchId ?? null,
        propertyId: payload.propertyId ?? null,
        tenantId: payload.tenantId ?? null,
      },
    });
  }

  @OnEvent('match.accepted', { async: true })
  async onMatchAccepted(payload: any) {
    if (!payload?.tenantId) return;
    await this.notifications.create({
      userId: payload.tenantId,
      type: NotificationType.MATCH_CREATED,
      title: 'Match aceptado',
      body: 'El propietario aceptó tu match.',
      data: {
        matchId: payload.matchId ?? null,
        propertyId: payload.propertyId ?? null,
      },
    });
  }

  @OnEvent('message.created', { async: true })
  async onMessageCreated(payload: any) {
    if (!payload?.receiverId) return;
    await this.notifications.create({
      userId: payload.receiverId,
      type: NotificationType.MESSAGE_RECEIVED,
      title: 'Nuevo mensaje',
      body: 'Tienes un nuevo mensaje.',
      data: {
        conversationId: payload.conversationId ?? null,
        messageId: payload.messageId ?? null,
        senderId: payload.senderId ?? null,
      },
    });
  }

  @OnEvent('payment.created', { async: true })
  async onPaymentCreated(payload: any) {
    if (!payload?.payerId) return;
    await this.notifications.create({
      userId: payload.payerId,
      type: NotificationType.PAYMENT_DUE,
      title: 'Pago pendiente',
      body: 'Tienes un nuevo pago por realizar.',
      data: {
        paymentId: payload.paymentId ?? null,
        leaseId: payload.leaseId ?? null,
        amount: payload.amount ?? null,
        currency: payload.currency ?? null,
        dueDate: payload.dueDate ?? null,
      },
    });
  }

  @OnEvent('payment.paid', { async: true })
  async onPaymentPaid(payload: any) {
    if (payload?.payerId) {
      await this.notifications.create({
        userId: payload.payerId,
        type: NotificationType.PAYMENT_PAID,
        title: 'Pago confirmado',
        body: 'Tu pago se procesó correctamente.',
        data: {
          paymentId: payload.paymentId ?? null,
          leaseId: payload.leaseId ?? null,
          amount: payload.amount ?? null,
        },
      });
    }
    if (payload?.landlordId) {
      await this.notifications.create({
        userId: payload.landlordId,
        type: NotificationType.PAYMENT_PAID,
        title: 'Pago recibido',
        body: 'Recibiste un pago de tu inquilino.',
        data: {
          paymentId: payload.paymentId ?? null,
          leaseId: payload.leaseId ?? null,
          amount: payload.amount ?? null,
        },
      });
    }
  }

  @OnEvent('payment.failed', { async: true })
  async onPaymentFailed(payload: any) {
    if (!payload?.payerId) return;
    await this.notifications.create({
      userId: payload.payerId,
      type: NotificationType.PAYMENT_FAILED,
      title: 'Pago fallido',
      body: 'Tu pago no pudo ser procesado.',
      data: {
        paymentId: payload.paymentId ?? null,
        leaseId: payload.leaseId ?? null,
        reason: payload.reason ?? null,
      },
    });
  }

  @OnEvent('dispute.created', { async: true })
  async onDisputeCreated(payload: any) {
    if (!payload?.againstId) return;
    await this.notifications.create({
      userId: payload.againstId,
      type: NotificationType.DISPUTE_OPENED,
      title: 'Disputa abierta',
      body: 'Se ha abierto una disputa en tu contra.',
      data: {
        disputeId: payload.disputeId ?? null,
        leaseId: payload.leaseId ?? null,
        openerId: payload.openerId ?? null,
      },
    });
  }

  @OnEvent('service.updated', { async: true })
  async onServiceUpdated(payload: any) {
    const requesterId = payload?.requesterId ?? payload?.userId;
    if (!requesterId) return;
    await this.notifications.create({
      userId: requesterId,
      type: NotificationType.SERVICE_UPDATED,
      title: 'Servicio actualizado',
      body: 'Hay una actualización en tu solicitud de servicio.',
      data: {
        requestId: payload.requestId ?? null,
        status: payload.status ?? null,
      },
    });
  }

  @OnEvent('lease.created', { async: true })
  async onLeaseCreated(payload: any) {
    if (payload?.tenantId) {
      await this.notifications.create({
        userId: payload.tenantId,
        type: NotificationType.LEASE_CREATED,
        title: 'Contrato creado',
        body: 'Se ha creado un nuevo contrato de arrendamiento.',
        data: {
          leaseId: payload.leaseId ?? null,
          propertyId: payload.propertyId ?? null,
        },
      });
    }
    if (payload?.landlordId) {
      await this.notifications.create({
        userId: payload.landlordId,
        type: NotificationType.LEASE_CREATED,
        title: 'Contrato creado',
        body: 'Se ha creado un nuevo contrato de arrendamiento.',
        data: {
          leaseId: payload.leaseId ?? null,
          propertyId: payload.propertyId ?? null,
        },
      });
    }
  }

  @OnEvent('trust.score_updated', { async: true })
  async onTrustScoreUpdated(payload: any) {
    if (!payload?.userId) return;
    await this.notifications.create({
      userId: payload.userId,
      type: NotificationType.TRUST_SCORE_UPDATED,
      title: 'Tu Trust Score cambió',
      body: 'Tu puntaje de confianza se ha actualizado.',
      data: {
        newScore: payload.newScore ?? null,
        delta: payload.delta ?? null,
        reason: payload.reason ?? null,
      },
    });
  }
}

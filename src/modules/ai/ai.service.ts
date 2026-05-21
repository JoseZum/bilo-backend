import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PaymentStatus } from '../../common/constants/domain-enums';
import { serializeJson } from '../../common/utils/db-json';
import { PrismaService } from '../../prisma/prisma.service';
import { AskDto } from './dto/ask.dto';
import { UpsertContextDto } from './dto/upsert-context.dto';
import { AI_PROVIDER, AIProvider } from './providers/ai-provider.interface';

@Injectable()
export class AIService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(AI_PROVIDER) private readonly provider: AIProvider,
  ) {}

  async upsertPropertyContext(
    landlordId: string,
    propertyId: string,
    dto: UpsertContextDto,
  ) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property || property.deletedAt) {
      throw new NotFoundException('Property not found');
    }
    if (property.landlordId !== landlordId) {
      throw new ForbiddenException('You do not own this property');
    }

    return this.prisma.aIPropertyContext.upsert({
      where: { propertyId },
      create: {
        propertyId,
        context: dto.context,
        metadata: serializeJson(dto.metadata),
      },
      update: {
        context: dto.context,
        metadata: serializeJson(dto.metadata),
      },
    });
  }

  async getPropertyContext(propertyId: string) {
    const ctx = await this.prisma.aIPropertyContext.findUnique({
      where: { propertyId },
    });
    if (!ctx) throw new NotFoundException('AI context not found');
    return ctx;
  }

  async askProperty(userId: string, propertyId: string, dto: AskDto) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: { aiContext: true },
    });
    if (!property || property.deletedAt) {
      throw new NotFoundException('Property not found');
    }

    const contextText = this.buildPropertyContextText(property);

    const conversation = await this.findOrCreateConversation({
      userId,
      propertyId,
      leaseId: null,
      scope: 'property',
    });

    const result = await this.provider.ask({
      scope: 'property',
      scopeId: propertyId,
      question: dto.question,
      contextText,
    });

    await this.persistMessages(conversation.id, dto.question, result.answer);

    this.eventEmitter.emit('ai.question_asked', {
      userId,
      propertyId,
      scope: 'property',
      conversationId: conversation.id,
    });

    return { answer: result.answer, usedContext: result.usedContext };
  }

  async askLease(userId: string, leaseId: string, dto: AskDto) {
    const lease = await this.prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        property: true,
        tenant: true,
        landlord: true,
        payments: true,
        ratings: true,
      },
    });
    if (!lease) throw new NotFoundException('Lease not found');
    if (lease.tenantId !== userId && lease.landlordId !== userId) {
      throw new ForbiddenException('You are not part of this lease');
    }

    const contextText = this.buildLeaseContextText(lease);

    const conversation = await this.findOrCreateConversation({
      userId,
      propertyId: lease.propertyId,
      leaseId,
      scope: 'lease',
    });

    const result = await this.provider.ask({
      scope: 'lease',
      scopeId: leaseId,
      question: dto.question,
      contextText,
    });

    await this.persistMessages(conversation.id, dto.question, result.answer);

    this.eventEmitter.emit('ai.question_asked', {
      userId,
      leaseId,
      scope: 'lease',
      conversationId: conversation.id,
    });

    return { answer: result.answer, usedContext: result.usedContext };
  }

  // ───────────── helpers ─────────────

  private buildPropertyContextText(property: any): string {
    const parts: string[] = [];
    parts.push(`Property: ${property.title}`);
    if (property.description) parts.push(property.description);
    parts.push(
      `monthlyPrice ${property.monthlyPrice} ${property.currency}`,
    );
    parts.push(`petsAllowed: ${property.petsAllowed}`);
    parts.push(`parking: ${property.parking}`);
    parts.push(`furnished: ${property.furnished}`);
    parts.push(`bedrooms: ${property.bedrooms}`);
    parts.push(`bathrooms: ${property.bathrooms}`);
    parts.push(`city: ${property.city}`);
    if (property.zone) parts.push(`zone: ${property.zone}`);

    const aiCtx = property.aiContext?.context;
    if (aiCtx) parts.push(aiCtx);

    return parts.join('; ');
  }

  private buildLeaseContextText(lease: any): string {
    const property = lease.property;
    const parts: string[] = [];
    if (property) {
      parts.push(`Property: ${property.title}`);
      parts.push(`city: ${property.city}`);
      if (property.zone) parts.push(`zone: ${property.zone}`);
      parts.push(`bedrooms: ${property.bedrooms}`);
      parts.push(`bathrooms: ${property.bathrooms}`);
      parts.push(`petsAllowed: ${property.petsAllowed}`);
      parts.push(`parking: ${property.parking}`);
      parts.push(`furnished: ${property.furnished}`);
    }
    parts.push(`monthlyAmount ${lease.monthlyAmount} ${lease.currency}`);
    parts.push(`leaseStatus: ${lease.status}`);

    const payments: any[] = lease.payments ?? [];
    const paidCount = payments.filter(
      (p) => p.status === PaymentStatus.PAID,
    ).length;
    const failedCount = payments.filter(
      (p) => p.status === PaymentStatus.FAILED,
    ).length;
    parts.push(`paymentsPaid: ${paidCount}`);
    parts.push(`paymentsFailed: ${failedCount}`);

    const ratings: any[] = lease.ratings ?? [];
    parts.push(`ratingsCount: ${ratings.length}`);

    const tenantTrust = lease.tenant?.trustScore;
    if (tenantTrust !== undefined && tenantTrust !== null) {
      parts.push(`tenantTrustScore: ${tenantTrust}`);
    }

    return parts.join('; ');
  }

  private async findOrCreateConversation(input: {
    userId: string;
    propertyId: string | null;
    leaseId: string | null;
    scope: 'property' | 'lease';
  }) {
    const where: Prisma.AIConversationWhereInput = {
      userId: input.userId,
      scope: input.scope,
    };
    if (input.propertyId) where.propertyId = input.propertyId;
    if (input.leaseId) where.leaseId = input.leaseId;

    const existing = await this.prisma.aIConversation.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
    });
    if (existing) return existing;

    return this.prisma.aIConversation.create({
      data: {
        userId: input.userId,
        propertyId: input.propertyId ?? undefined,
        leaseId: input.leaseId ?? undefined,
        scope: input.scope,
      },
    });
  }

  private async persistMessages(
    conversationId: string,
    question: string,
    answer: string,
  ) {
    await this.prisma.aIMessage.create({
      data: { conversationId, role: 'user', content: question },
    });
    await this.prisma.aIMessage.create({
      data: { conversationId, role: 'assistant', content: answer },
    });
  }
}

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { MessageType } from '../../common/constants/domain-enums';
import { PrismaService } from '../../prisma/prisma.service';

export interface ListMessagesOptions {
  take?: number;
  skip?: number;
  cursor?: string;
}

export interface SendMessageInput {
  content: string;
  messageType?: MessageType;
}

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createForMatch(matchId: string) {
    const existing = await this.prisma.conversation.findUnique({
      where: { matchId },
    });
    if (existing) return existing;

    return this.prisma.conversation.create({
      data: { matchId },
    });
  }

  async findById(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { match: true },
    });
    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }
    this.assertParticipant(conversation.match, userId);
    return conversation;
  }

  async findForUser(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        OR: [
          { match: { tenantId: userId } },
          { match: { landlordId: userId } },
        ],
      },
      include: {
        match: {
          include: {
            tenant: { select: { id: true, fullName: true, avatarUrl: true } },
            landlord: { select: { id: true, fullName: true, avatarUrl: true } },
            property: { select: { id: true, title: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    input: SendMessageInput,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { match: true },
    });
    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }
    this.assertParticipant(conversation.match, senderId);

    const receiverId =
      conversation.match.tenantId === senderId
        ? conversation.match.landlordId
        : conversation.match.tenantId;

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: input.content,
        messageType: input.messageType ?? MessageType.TEXT,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    this.eventEmitter.emit('message.created', {
      messageId: message.id,
      conversationId,
      senderId,
      receiverId,
    });

    return message;
  }

  async listMessages(
    conversationId: string,
    userId: string,
    opts: ListMessagesOptions = {},
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { match: true },
    });
    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }
    this.assertParticipant(conversation.match, userId);

    const take = Math.min(Math.max(opts.take ?? 50, 1), 100);
    const skip = opts.skip ?? 0;

    const where: Prisma.MessageWhereInput = { conversationId };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        ...(opts.cursor
          ? { cursor: { id: opts.cursor }, skip: 1 }
          : {}),
      }),
      this.prisma.message.count({ where }),
    ]);

    return { items, total, take, skip };
  }

  async markRead(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { match: true },
    });
    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }
    this.assertParticipant(conversation.match, userId);

    const result = await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return { updated: result.count };
  }

  private assertParticipant(
    match: { tenantId: string; landlordId: string },
    userId: string,
  ) {
    if (match.tenantId !== userId && match.landlordId !== userId) {
      throw new ForbiddenException('Not a participant of this conversation');
    }
  }
}

import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NotificationType } from '../../common/constants/domain-enums';
import { serializeJson } from '../../common/utils/db-json';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any> | null;
}

export interface ListNotificationsOptions {
  take?: number;
  skip?: number;
  unreadOnly?: boolean;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateNotificationInput) {
    try {
      return await this.prisma.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          body: input.body,
          data: serializeJson(input.data),
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to create notification for user=${input.userId} type=${input.type}`,
        err as Error,
      );
      return null;
    }
  }

  listForUser(userId: string, opts: ListNotificationsOptions = {}) {
    const where: Prisma.NotificationWhereInput = { userId };
    if (opts.unreadOnly) where.readAt = null;

    const take = Math.min(opts.take ?? 50, 200);
    const skip = opts.skip ?? 0;

    return this.prisma.notification.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
    });
  }

  async markRead(notificationId: string, userId: string) {
    const notif = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notif) throw new NotFoundException('Notification not found');
    if (notif.userId !== userId) {
      throw new ForbiddenException('You do not own this notification');
    }
    if (notif.readAt) return notif;
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }
}

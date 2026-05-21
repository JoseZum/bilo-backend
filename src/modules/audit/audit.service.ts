import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditAction } from '../../common/constants/domain-enums';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditContext, AuditListFilter } from './dto/audit-context';
import { serializeJson } from '../../common/utils/db-json';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(ctx: AuditContext) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          actorUserId: ctx.actorUserId ?? null,
          entityType: ctx.entityType,
          entityId: ctx.entityId ?? null,
          action: ctx.action,
          oldValues: serializeJson(ctx.oldValues),
          newValues: serializeJson(ctx.newValues),
          ipAddress: ctx.ipAddress ?? null,
          userAgent: ctx.userAgent ?? null,
          metadata: serializeJson(ctx.metadata),
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to write audit log for action=${ctx.action} entity=${ctx.entityType}`,
        err as Error,
      );
      return null;
    }
  }

  list(filter: AuditListFilter) {
    const where: Prisma.AuditLogWhereInput = {};
    if (filter.entityType) where.entityType = filter.entityType;
    if (filter.entityId) where.entityId = filter.entityId;
    if (filter.action) where.action = filter.action as AuditAction;
    if (filter.actorUserId) where.actorUserId = filter.actorUserId;

    const take = Math.min(filter.take ?? 50, 200);
    const skip = filter.skip ?? 0;

    return this.prisma.auditLog.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
    });
  }
}

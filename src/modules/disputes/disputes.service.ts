import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DisputeStatus, TrustEventType, UserRole } from '../../common/constants/domain-enums';
import { PrismaService } from '../../prisma/prisma.service';
import { TrustService } from '../trust/trust.service';
import { AddEvidenceDto } from './dto/add-evidence.dto';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeDto } from './dto/update-dispute.dto';

@Injectable()
export class DisputesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trustService: TrustService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(openerId: string, dto: CreateDisputeDto) {
    if (openerId === dto.againstId) {
      throw new BadRequestException('Cannot open a dispute against yourself');
    }

    if (dto.leaseId) {
      const lease = await this.prisma.lease.findUnique({
        where: { id: dto.leaseId },
        select: { id: true, tenantId: true, landlordId: true },
      });
      if (!lease) throw new NotFoundException('Lease not found');
      if (lease.tenantId !== openerId && lease.landlordId !== openerId) {
        throw new ForbiddenException('You are not part of this lease');
      }
    }

    const against = await this.prisma.user.findUnique({
      where: { id: dto.againstId },
      select: { id: true },
    });
    if (!against) throw new NotFoundException('Against user not found');

    const dispute = await this.prisma.dispute.create({
      data: {
        leaseId: dto.leaseId ?? null,
        openerId,
        againstId: dto.againstId,
        type: dto.type,
        status: DisputeStatus.OPEN,
        title: dto.title,
        description: dto.description,
      },
    });

    this.eventEmitter.emit('dispute.created', {
      disputeId: dispute.id,
      openerId,
      againstId: dto.againstId,
      type: dto.type,
    });

    return dispute;
  }

  async addEvidence(disputeId: string, userId: string, dto: AddEvidenceDto) {
    if (!dto.url && !dto.note) {
      throw new BadRequestException('Provide at least one of: url, note');
    }

    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      select: { id: true, openerId: true, againstId: true, status: true },
    });
    if (!dispute) throw new NotFoundException('Dispute not found');

    if (dispute.openerId !== userId && dispute.againstId !== userId) {
      throw new ForbiddenException('Only dispute parties can add evidence');
    }

    if (
      dispute.status === DisputeStatus.RESOLVED ||
      dispute.status === DisputeStatus.REJECTED ||
      dispute.status === DisputeStatus.CANCELLED
    ) {
      throw new BadRequestException('Cannot add evidence to a closed dispute');
    }

    return this.prisma.disputeEvidence.create({
      data: {
        disputeId,
        type: dto.type,
        url: dto.url ?? null,
        note: dto.note ?? null,
      },
    });
  }

  async update(
    disputeId: string,
    actorId: string,
    actorRole: UserRole,
    dto: UpdateDisputeDto,
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      select: {
        id: true,
        openerId: true,
        againstId: true,
        status: true,
      },
    });
    if (!dispute) throw new NotFoundException('Dispute not found');

    const isOpener = dispute.openerId === actorId;
    const isAdmin = actorRole === UserRole.ADMIN;

    if (dto.status) {
      if (dto.status === DisputeStatus.CANCELLED) {
        if (!isOpener && !isAdmin) {
          throw new ForbiddenException('Only the opener (or admin) can cancel');
        }
      } else if (
        dto.status === DisputeStatus.UNDER_REVIEW ||
        dto.status === DisputeStatus.RESOLVED ||
        dto.status === DisputeStatus.REJECTED
      ) {
        if (!isAdmin) {
          throw new ForbiddenException('Only admins can transition to this status');
        }
      } else if (dto.status === DisputeStatus.OPEN) {
        throw new BadRequestException('Cannot transition back to OPEN');
      }
    } else if (dto.resolution !== undefined) {
      if (!isAdmin) {
        throw new ForbiddenException('Only admins can set the resolution');
      }
    }

    const isResolving = dto.status === DisputeStatus.RESOLVED;
    if (isResolving && !dto.resolvedInFavorOf) {
      throw new BadRequestException(
        'resolvedInFavorOf is required when setting status to RESOLVED',
      );
    }

    const updated = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: dto.status ?? undefined,
        resolution: dto.resolution ?? undefined,
        resolvedAt: isResolving ? new Date() : undefined,
      },
    });

    if (isResolving && dto.resolvedInFavorOf) {
      if (dto.resolvedInFavorOf === 'opener') {
        await this.trustService.recordEvent({
          userId: dispute.againstId,
          type: TrustEventType.DISPUTE_RESOLVED_AGAINST,
          reason: 'dispute_resolved_against',
          metadata: { disputeId },
        });
        await this.trustService.recordEvent({
          userId: dispute.openerId,
          type: TrustEventType.DISPUTE_RESOLVED_FAVOR,
          reason: 'dispute_resolved_favor',
          metadata: { disputeId },
        });
      } else {
        await this.trustService.recordEvent({
          userId: dispute.openerId,
          type: TrustEventType.DISPUTE_RESOLVED_AGAINST,
          reason: 'dispute_resolved_against',
          metadata: { disputeId },
        });
        await this.trustService.recordEvent({
          userId: dispute.againstId,
          type: TrustEventType.DISPUTE_RESOLVED_FAVOR,
          reason: 'dispute_resolved_favor',
          metadata: { disputeId },
        });
      }
    }

    this.eventEmitter.emit('dispute.updated', {
      disputeId,
      actorId,
      status: updated.status,
      resolvedInFavorOf: isResolving ? dto.resolvedInFavorOf : undefined,
    });

    return updated;
  }

  async findById(id: string, userId: string, role: UserRole) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      include: {
        evidence: { orderBy: { createdAt: 'desc' } },
        opener: { select: { id: true, fullName: true, avatarUrl: true } },
        against: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
    if (!dispute) throw new NotFoundException('Dispute not found');

    const isParty = dispute.openerId === userId || dispute.againstId === userId;
    if (!isParty && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not allowed to view this dispute');
    }
    return dispute;
  }

  listForUser(userId: string) {
    return this.prisma.dispute.findMany({
      where: {
        OR: [{ openerId: userId }, { againstId: userId }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

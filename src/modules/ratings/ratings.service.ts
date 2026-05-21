import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TrustEventType } from '../../common/constants/domain-enums';
import { PrismaService } from '../../prisma/prisma.service';
import { TrustService } from '../trust/trust.service';
import { CreateRatingDto } from './dto/create-rating.dto';

@Injectable()
export class RatingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trustService: TrustService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(leaseId: string, fromUserId: string, dto: CreateRatingDto) {
    if (dto.score < 1 || dto.score > 5) {
      throw new BadRequestException('Score must be between 1 and 5');
    }
    if (dto.toUserId === fromUserId) {
      throw new BadRequestException('Cannot rate yourself');
    }

    const lease = await this.prisma.lease.findUnique({
      where: { id: leaseId },
      select: { id: true, tenantId: true, landlordId: true },
    });
    if (!lease) throw new NotFoundException('Lease not found');

    const parties = new Set([lease.tenantId, lease.landlordId]);
    if (!parties.has(fromUserId) || !parties.has(dto.toUserId)) {
      throw new ForbiddenException(
        'Both fromUser and toUser must be parties of the lease',
      );
    }

    const existing = await this.prisma.rating.findUnique({
      where: {
        leaseId_fromId_toId: {
          leaseId,
          fromId: fromUserId,
          toId: dto.toUserId,
        },
      },
    });
    if (existing) {
      throw new ConflictException('Rating already exists for this lease/from/to');
    }

    const rating = await this.prisma.rating.create({
      data: {
        leaseId,
        fromId: fromUserId,
        toId: dto.toUserId,
        score: dto.score,
        comment: dto.comment ?? null,
      },
    });

    await this.trustService.recordEvent({
      userId: dto.toUserId,
      type:
        dto.score >= 4
          ? TrustEventType.POSITIVE_RATING
          : dto.score <= 2
            ? TrustEventType.NEGATIVE_RATING
            : TrustEventType.OTHER,
      reason: `rating_${dto.score}`,
      metadata: { ratingId: rating.id, leaseId },
    });

    this.eventEmitter.emit('rating.created', {
      ratingId: rating.id,
      leaseId,
      fromId: fromUserId,
      toId: dto.toUserId,
      score: dto.score,
    });

    return rating;
  }

  listForUser(userId: string) {
    return this.prisma.rating.findMany({
      where: { toId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        from: {
          select: { id: true, fullName: true, avatarUrl: true, role: true },
        },
      },
    });
  }
}

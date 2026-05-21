import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { MatchStatus, SwipeAction } from '../../common/constants/domain-enums';
import { PrismaService } from '../../prisma/prisma.service';
import { PropertiesService } from '../properties/properties.service';
import { RespondMatchAction } from './dto/respond-match.dto';

@Injectable()
export class MatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly propertiesService: PropertiesService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(tenantId: string, propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property || property.deletedAt) {
      throw new NotFoundException('Property not found');
    }

    const swipe = await this.prisma.swipe.findUnique({
      where: {
        userId_propertyId: { userId: tenantId, propertyId },
      },
    });
    if (
      !swipe ||
      (swipe.action !== SwipeAction.LIKE && swipe.action !== SwipeAction.SUPERLIKE)
    ) {
      throw new BadRequestException(
        'You must LIKE or SUPERLIKE the property before creating a match',
      );
    }

    if (property.landlordId === tenantId) {
      throw new BadRequestException('You cannot match your own property');
    }

    try {
      const match = await this.prisma.match.create({
        data: {
          tenantId,
          landlordId: property.landlordId,
          propertyId,
          status: MatchStatus.PENDING,
        },
      });

      this.eventEmitter.emit('match.created', {
        matchId: match.id,
        tenantId: match.tenantId,
        landlordId: match.landlordId,
        propertyId: match.propertyId,
      });

      return match;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          'Match already exists for this tenant and property',
        );
      }
      throw err;
    }
  }

  async respond(
    matchId: string,
    landlordId: string,
    action: RespondMatchAction,
  ) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });
    if (!match) throw new NotFoundException('Match not found');
    if (match.landlordId !== landlordId) {
      throw new ForbiddenException('Only the landlord can respond to this match');
    }
    if (match.status !== MatchStatus.PENDING) {
      throw new BadRequestException(
        `Match is not pending; current status: ${match.status}`,
      );
    }

    const now = new Date();

    if (action === 'accept') {
      const updated = await this.prisma.match.update({
        where: { id: matchId },
        data: {
          status: MatchStatus.ACTIVE,
          acceptedAt: now,
        },
      });

      // Best-effort: create the conversation directly. Safe if no listener does it.
      await this.prisma.conversation
        .upsert({
          where: { matchId: updated.id },
          create: { matchId: updated.id },
          update: {},
        })
        .catch(() => undefined);

      this.propertiesService
        .incrementMatch(updated.propertyId)
        .catch(() => undefined);

      this.eventEmitter.emit('match.accepted', {
        matchId: updated.id,
        tenantId: updated.tenantId,
        landlordId: updated.landlordId,
        propertyId: updated.propertyId,
      });

      return updated;
    }

    // reject
    const updated = await this.prisma.match.update({
      where: { id: matchId },
      data: {
        status: MatchStatus.REJECTED,
        rejectedAt: now,
      },
    });

    this.eventEmitter.emit('match.rejected', {
      matchId: updated.id,
      tenantId: updated.tenantId,
      landlordId: updated.landlordId,
      propertyId: updated.propertyId,
    });

    return updated;
  }

  findForUser(userId: string) {
    return this.prisma.match.findMany({
      where: {
        OR: [{ tenantId: userId }, { landlordId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        property: {
          include: {
            images: { orderBy: { position: 'asc' }, take: 3 },
          },
        },
        tenant: {
          select: { id: true, fullName: true, avatarUrl: true, trustScore: true },
        },
        landlord: {
          select: { id: true, fullName: true, avatarUrl: true, trustScore: true },
        },
        conversation: true,
      },
    });
  }

  async findById(matchId: string, userId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        property: {
          include: {
            images: { orderBy: { position: 'asc' } },
          },
        },
        tenant: {
          select: { id: true, fullName: true, avatarUrl: true, trustScore: true },
        },
        landlord: {
          select: { id: true, fullName: true, avatarUrl: true, trustScore: true },
        },
        conversation: true,
      },
    });
    if (!match) throw new NotFoundException('Match not found');
    if (match.tenantId !== userId && match.landlordId !== userId) {
      throw new ForbiddenException('You are not part of this match');
    }
    return match;
  }
}

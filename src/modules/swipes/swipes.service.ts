import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { SwipeAction } from '../../common/constants/domain-enums';
import { PrismaService } from '../../prisma/prisma.service';
import { PropertiesService } from '../properties/properties.service';
import { CreateSwipeDto } from './dto/create-swipe.dto';

export interface SwipeHistoryOptions {
  take?: number;
  skip?: number;
}

@Injectable()
export class SwipesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly propertiesService: PropertiesService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(userId: string, dto: CreateSwipeDto) {
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });
    if (!property || property.deletedAt) {
      throw new NotFoundException('Property not found');
    }

    try {
      const swipe = await this.prisma.swipe.create({
        data: {
          userId,
          propertyId: dto.propertyId,
          action: dto.action,
        },
      });

      if (dto.action === SwipeAction.LIKE || dto.action === SwipeAction.SUPERLIKE) {
        this.propertiesService
          .incrementLike(dto.propertyId)
          .catch(() => undefined);
      }

      this.eventEmitter.emit('swipe.created', {
        swipeId: swipe.id,
        userId: swipe.userId,
        propertyId: swipe.propertyId,
        action: swipe.action,
      });

      return swipe;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('Already swiped on this property');
      }
      throw err;
    }
  }

  history(userId: string, opts?: SwipeHistoryOptions) {
    const take = opts?.take ?? 50;
    const skip = opts?.skip ?? 0;
    return this.prisma.swipe.findMany({
      where: { userId },
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        property: {
          include: {
            images: { orderBy: { position: 'asc' }, take: 5 },
          },
        },
      },
    });
  }
}

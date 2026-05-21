import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { TrustEventType } from '../../common/constants/domain-enums';
import { PrismaService } from '../../prisma/prisma.service';
import { serializeJson } from '../../common/utils/db-json';

export interface RecordEventInput {
  userId: string;
  type: TrustEventType;
  delta?: number;
  reason?: string;
  metadata?: Record<string, any>;
}

const TRUST_RULES: Record<TrustEventType, number> = {
  IDENTITY_VERIFIED: 10,
  PAYMENT_ON_TIME: 15,
  PAYMENT_LATE: -20,
  POSITIVE_RATING: 5,
  NEGATIVE_RATING: -3,
  DISPUTE_RESOLVED_AGAINST: -25,
  DISPUTE_RESOLVED_FAVOR: 5,
  PROFILE_COMPLETED: 5,
  OTHER: 0,
};

const MIN_SCORE = 0;
const MAX_SCORE = 100;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

@Injectable()
export class TrustService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async recordEvent(input: RecordEventInput): Promise<{ newScore: number; delta: number }> {
    const { userId, type, reason, metadata } = input;
    const delta =
      typeof input.delta === 'number' ? input.delta : TRUST_RULES[type] ?? 0;

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, trustScore: true },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      await tx.trustEvent.create({
        data: {
          userId,
          type,
          delta,
          reason: reason ?? null,
          metadata: serializeJson(metadata),
        },
      });

      const oldScore = user.trustScore;
      const newScore = clamp(oldScore + delta, MIN_SCORE, MAX_SCORE);

      await tx.user.update({
        where: { id: userId },
        data: { trustScore: newScore },
      });

      await tx.trustScoreHistory.create({
        data: {
          userId,
          oldScore,
          newScore,
          delta,
          reason: reason ?? null,
        },
      });

      return { oldScore, newScore };
    });

    this.eventEmitter.emit('trust.score_updated', {
      userId,
      oldScore: result.oldScore,
      newScore: result.newScore,
      delta,
      type,
    });

    return { newScore: result.newScore, delta };
  }

  async getScore(userId: string): Promise<{ userId: string; trustScore: number }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, trustScore: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return { userId: user.id, trustScore: user.trustScore };
  }

  async getHistory(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, trustScore: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const [history, events] = await Promise.all([
      this.prisma.trustScoreHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.trustEvent.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    return {
      userId,
      currentScore: user.trustScore,
      history,
      recentEvents: events,
    };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { Prisma, Property } from '@prisma/client';
import { PropertyStatus } from '../../../common/constants/domain-enums';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  RecommendationEngine,
  RecommendationEngineOptions,
} from './recommendation-engine.interface';

interface ResolvedPreferences {
  budgetMin: number;
  budgetMax: number;
  preferredCity: string | null;
  preferredZone: string | null;
  acceptsPets: boolean;
  needsParking: boolean;
  needsFurnished: boolean;
  minBedrooms: number;
}

const DEFAULT_PREFERENCES: ResolvedPreferences = {
  budgetMin: 0,
  budgetMax: 9_999_999,
  preferredCity: null,
  preferredZone: null,
  acceptsPets: false,
  needsParking: false,
  needsFurnished: false,
  minBedrooms: 0,
};

@Injectable()
export class PostgresRecommendationEngine implements RecommendationEngine {
  private readonly logger = new Logger(PostgresRecommendationEngine.name);

  constructor(private readonly prisma: PrismaService) {}

  async recommendForUser(
    userId: string,
    opts?: RecommendationEngineOptions,
  ): Promise<Property[]> {
    const take = opts?.take ?? 20;
    const skip = opts?.skip ?? 0;

    const prefs = await this.resolvePreferences(userId);
    const swipedIds = await this.getSwipedPropertyIds(userId);

    const where: Prisma.PropertyWhereInput = {
      status: PropertyStatus.ACTIVE,
      deletedAt: null,
      landlordId: { not: userId },
      monthlyPrice: {
        gte: prefs.budgetMin,
        lte: prefs.budgetMax,
      },
      bedrooms: { gte: prefs.minBedrooms },
    };

    if (swipedIds.length > 0) {
      where.id = { notIn: swipedIds };
    }
    if (prefs.preferredCity) {
      where.city = { contains: prefs.preferredCity };
    }
    if (prefs.preferredZone) {
      where.zone = { contains: prefs.preferredZone };
    }
    // "petsAllowed >= acceptsPets" → if user accepts pets it does NOT matter;
    // if user does NOT accept pets, we don't need to filter on the property side.
    // Interpretation: if user needs feature, property must have feature.
    if (prefs.acceptsPets) {
      where.petsAllowed = true;
    }
    if (prefs.needsParking) {
      where.parking = true;
    }
    if (prefs.needsFurnished) {
      where.furnished = true;
    }

    try {
      const properties = await this.prisma.property.findMany({
        where,
        take,
        skip,
        include: {
          images: { orderBy: { position: 'asc' }, take: 5 },
          analytics: true,
          landlord: { select: { id: true, trustScore: true, fullName: true, avatarUrl: true } },
        },
        orderBy: [
          { landlord: { trustScore: 'desc' } },
          { monthlyPrice: 'asc' },
        ],
      });
      if (properties.length > 0) {
        return properties as unknown as Property[];
      }

      this.logger.warn(
        `No strict recommendation results for user ${userId}; falling back to active properties`,
      );

      const fallbackProperties = await this.prisma.property.findMany({
        where: {
          status: PropertyStatus.ACTIVE,
          deletedAt: null,
          landlordId: { not: userId },
        },
        take,
        skip,
        include: {
          images: { orderBy: { position: 'asc' }, take: 5 },
          analytics: true,
          landlord: { select: { id: true, trustScore: true, fullName: true, avatarUrl: true } },
        },
        orderBy: [
          { landlord: { trustScore: 'desc' } },
          { monthlyPrice: 'asc' },
        ],
      });

      return fallbackProperties as unknown as Property[];
    } catch (err) {
      this.logger.error(
        `Failed to compute postgres recommendations for user ${userId}`,
        err as Error,
      );
      return [];
    }
  }

  private async resolvePreferences(userId: string): Promise<ResolvedPreferences> {
    const pref = await this.prisma.userPreference.findUnique({
      where: { userId },
    });
    if (!pref) return { ...DEFAULT_PREFERENCES };
    return {
      budgetMin: pref.budgetMin ?? DEFAULT_PREFERENCES.budgetMin,
      budgetMax: pref.budgetMax ?? DEFAULT_PREFERENCES.budgetMax,
      preferredCity: pref.preferredCity ?? null,
      preferredZone: pref.preferredZone ?? null,
      acceptsPets: pref.acceptsPets ?? false,
      needsParking: pref.needsParking ?? false,
      needsFurnished: pref.needsFurnished ?? false,
      minBedrooms: pref.minBedrooms ?? 0,
    };
  }

  private async getSwipedPropertyIds(userId: string): Promise<string[]> {
    const swipes = await this.prisma.swipe.findMany({
      where: { userId },
      select: { propertyId: true },
    });
    return swipes.map((s) => s.propertyId);
  }
}

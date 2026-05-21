import { Property } from '@prisma/client';

export const RECOMMENDATION_ENGINE = 'RECOMMENDATION_ENGINE';

export interface RecommendationEngineOptions {
  take?: number;
  skip?: number;
}

export interface RecommendationEngine {
  recommendForUser(
    userId: string,
    opts?: RecommendationEngineOptions,
  ): Promise<Property[]>;
}

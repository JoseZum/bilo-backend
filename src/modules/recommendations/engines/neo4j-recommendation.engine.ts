import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { Property } from '@prisma/client';
import {
  RecommendationEngine,
  RecommendationEngineOptions,
} from './recommendation-engine.interface';

@Injectable()
export class Neo4jRecommendationEngine implements RecommendationEngine {
  private readonly logger = new Logger(Neo4jRecommendationEngine.name);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async recommendForUser(
    userId: string,
    _opts?: RecommendationEngineOptions,
  ): Promise<Property[]> {
    this.logger.warn(
      `Neo4j engine not implemented yet; called for user ${userId}`,
    );
    throw new NotImplementedException('Neo4j engine not implemented yet');
  }
}

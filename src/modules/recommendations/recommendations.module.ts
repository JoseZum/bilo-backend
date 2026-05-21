import { Logger, Module, Provider } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Neo4jRecommendationEngine } from './engines/neo4j-recommendation.engine';
import { PostgresRecommendationEngine } from './engines/postgres-recommendation.engine';
import { RECOMMENDATION_ENGINE } from './engines/recommendation-engine.interface';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';

const engineProvider: Provider = {
  provide: RECOMMENDATION_ENGINE,
  inject: [PrismaService],
  useFactory: (prisma: PrismaService) => {
    const engine = (process.env.RECOMMENDATION_ENGINE ?? 'sqlite').toLowerCase();
    const logger = new Logger('RecommendationsModule');
    if (engine === 'neo4j') {
      logger.log('Using Neo4jRecommendationEngine');
      return new Neo4jRecommendationEngine();
    }
    logger.log('Using Prisma-backed recommendation engine');
    return new PostgresRecommendationEngine(prisma);
  },
};

@Module({
  controllers: [RecommendationsController],
  providers: [
    RecommendationsService,
    PostgresRecommendationEngine,
    Neo4jRecommendationEngine,
    engineProvider,
  ],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}

import { Inject, Injectable } from '@nestjs/common';
import {
  RECOMMENDATION_ENGINE,
  RecommendationEngine,
  RecommendationEngineOptions,
} from './engines/recommendation-engine.interface';

@Injectable()
export class RecommendationsService {
  constructor(
    @Inject(RECOMMENDATION_ENGINE)
    private readonly engine: RecommendationEngine,
  ) {}

  getFeed(userId: string, opts?: RecommendationEngineOptions) {
    return this.engine.recommendForUser(userId, opts);
  }
}

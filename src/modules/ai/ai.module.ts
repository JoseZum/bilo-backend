import { Module, Provider } from '@nestjs/common';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { AI_PROVIDER, AIProvider } from './providers/ai-provider.interface';
import { MockAIProvider } from './providers/mock.provider';

const aiProviderProvider: Provider = {
  provide: AI_PROVIDER,
  useFactory: (): AIProvider => {
    const providerName = (process.env.AI_PROVIDER || 'mock').toLowerCase();
    switch (providerName) {
      case 'mock':
      default:
        return new MockAIProvider();
    }
  },
};

@Module({
  controllers: [AIController],
  providers: [AIService, MockAIProvider, aiProviderProvider],
  exports: [AIService],
})
export class AIModule {}

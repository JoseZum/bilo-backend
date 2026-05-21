import { Global, Module } from '@nestjs/common';
import { TrustController } from './trust.controller';
import { TrustListener } from './trust.listener';
import { TrustService } from './trust.service';

@Global()
@Module({
  controllers: [TrustController],
  providers: [TrustService, TrustListener],
  exports: [TrustService],
})
export class TrustModule {}

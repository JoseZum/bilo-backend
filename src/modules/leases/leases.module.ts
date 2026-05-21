import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { LeasesController } from './leases.controller';
import { LeasesService } from './leases.service';

@Module({
  imports: [PaymentsModule],
  controllers: [LeasesController],
  providers: [LeasesService],
  exports: [LeasesService],
})
export class LeasesModule {}

import { Module, Provider } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PAYMENT_PROVIDER } from './providers/payment-provider.interface';
import { StripeMockPaymentProvider } from './providers/stripe-mock.provider';

const paymentProviderFactory: Provider = {
  provide: PAYMENT_PROVIDER,
  useFactory: () => {
    const which = (process.env.PAYMENT_PROVIDER ?? 'stripe_mock').toLowerCase();
    switch (which) {
      case 'stripe_mock':
      default:
        return new StripeMockPaymentProvider();
    }
  },
};

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, StripeMockPaymentProvider, paymentProviderFactory],
  exports: [PaymentsService],
})
export class PaymentsModule {}

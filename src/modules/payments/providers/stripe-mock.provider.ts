import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import {
  PaymentProvider,
  PaymentProviderResult,
} from './payment-provider.interface';

@Injectable()
export class StripeMockPaymentProvider implements PaymentProvider {
  async charge(input: {
    paymentId: string;
    amount: number;
    currency: string;
    methodType: string;
  }): Promise<PaymentProviderResult> {
    if (input.methodType === 'fail_card') {
      return {
        success: false,
        providerRef: `mock_fail_${randomBytes(6).toString('hex')}`,
        raw: { simulated: true, reason: 'forced_failure' },
        message: 'Mock charge failed (fail_card)',
      };
    }

    return {
      success: true,
      providerRef: `mock_${randomBytes(8).toString('hex')}`,
      raw: {
        simulated: true,
        paymentId: input.paymentId,
        amount: input.amount,
        currency: input.currency,
        methodType: input.methodType,
      },
      message: 'Mock charge OK',
    };
  }

  async refund(input: {
    providerRef: string;
    amount: number;
  }): Promise<PaymentProviderResult> {
    return {
      success: true,
      providerRef: `mock_refund_${randomBytes(8).toString('hex')}`,
      raw: {
        simulated: true,
        originalRef: input.providerRef,
        amount: input.amount,
      },
      message: 'Mock refund OK',
    };
  }
}

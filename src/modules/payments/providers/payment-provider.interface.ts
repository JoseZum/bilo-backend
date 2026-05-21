export const PAYMENT_PROVIDER = 'PAYMENT_PROVIDER';

export interface PaymentProviderResult {
  success: boolean;
  providerRef: string;
  raw?: any;
  message?: string;
}

export interface PaymentProvider {
  charge(input: {
    paymentId: string;
    amount: number;
    currency: string;
    methodType: string;
  }): Promise<PaymentProviderResult>;

  refund(input: {
    providerRef: string;
    amount: number;
  }): Promise<PaymentProviderResult>;
}

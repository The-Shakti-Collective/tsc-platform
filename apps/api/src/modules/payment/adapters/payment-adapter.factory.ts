import { BadRequestException, Injectable } from '@nestjs/common';
import type { PaymentProviderValue } from '@tsc/database';
import type { PaymentAdapter } from './payment-adapter.interface';
import {
  CashfreeAdapter,
  ManualAdapter,
  RazorpayAdapter,
  StripeAdapter,
} from './stub-adapters';

@Injectable()
export class PaymentAdapterFactory {
  private readonly adapters: Map<PaymentProviderValue, PaymentAdapter>;

  constructor() {
    const instances: PaymentAdapter[] = [
      new RazorpayAdapter(),
      new StripeAdapter(),
      new CashfreeAdapter(),
      new ManualAdapter(),
    ];
    this.adapters = new Map(instances.map((a) => [a.provider, a]));
  }

  get(provider: PaymentProviderValue): PaymentAdapter {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new BadRequestException(`Unknown payment provider: ${provider}`);
    }
    return adapter;
  }

  listProviders(): PaymentProviderValue[] {
    return [...this.adapters.keys()];
  }
}

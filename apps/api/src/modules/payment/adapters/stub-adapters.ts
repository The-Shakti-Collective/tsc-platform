import { Logger } from '@nestjs/common';
import type { PaymentProviderValue } from '@tsc/database';
import type {
  EscrowHoldInput,
  EscrowHoldResult,
  EscrowReleaseInput,
  EscrowReleaseResult,
  PaymentAdapter,
  PaymentIntentInput,
  PaymentIntentResult,
  PayoutScheduleInput,
  PayoutScheduleResult,
} from './payment-adapter.interface';

function stubExternalId(prefix: string, referenceId: string): string {
  return `${prefix}_stub_${referenceId}_${Date.now()}`;
}

abstract class BaseStubAdapter implements PaymentAdapter {
  protected readonly logger = new Logger(this.constructor.name);

  abstract readonly provider: PaymentProviderValue;
  protected abstract readonly prefix: string;

  protected envKeyHint(): string {
    switch (this.provider) {
      case 'razorpay':
        return process.env.RAZORPAY_KEY ? '(key configured)' : '(RAZORPAY_KEY not set — stub only)';
      case 'stripe':
        return process.env.STRIPE_KEY ? '(key configured)' : '(STRIPE_KEY not set — stub only)';
      case 'cashfree':
        return process.env.CASHFREE_KEY ? '(key configured)' : '(CASHFREE_KEY not set — stub only)';
      default:
        return '(manual — no gateway key)';
    }
  }

  async createPaymentIntent(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    const externalId = stubExternalId(this.prefix, input.referenceId);
    this.logger.log(
      `[stub] createPaymentIntent provider=${this.provider} ${this.envKeyHint()} ref=${input.referenceId} amount=${input.amount} ${input.currency}`,
    );
    return {
      externalId,
      checkoutUrl: `https://pay.tsc.in/stub/${this.provider}/${externalId}`,
      status: 'created',
    };
  }

  async holdEscrow(input: EscrowHoldInput): Promise<EscrowHoldResult> {
    const externalId = stubExternalId(`${this.prefix}_escrow`, input.referenceId);
    this.logger.log(
      `[stub] holdEscrow provider=${this.provider} ${this.envKeyHint()} ref=${input.referenceId} amount=${input.amount}`,
    );
    return { externalId, status: 'holding' };
  }

  async releaseEscrow(input: EscrowReleaseInput): Promise<EscrowReleaseResult> {
    this.logger.log(
      `[stub] releaseEscrow provider=${this.provider} ${this.envKeyHint()} externalId=${input.externalId}`,
    );
    return { externalId: input.externalId, status: 'released' };
  }

  async schedulePayout(input: PayoutScheduleInput): Promise<PayoutScheduleResult> {
    const externalId = stubExternalId(`${this.prefix}_payout`, input.referenceId);
    this.logger.log(
      `[stub] schedulePayout provider=${this.provider} ${this.envKeyHint()} beneficiary=${input.beneficiaryId} amount=${input.amount}`,
    );
    return { externalId, status: 'scheduled' };
  }
}

export class RazorpayAdapter extends BaseStubAdapter {
  readonly provider = 'razorpay' as const;
  protected readonly prefix = 'rzp';
}

export class StripeAdapter extends BaseStubAdapter {
  readonly provider = 'stripe' as const;
  protected readonly prefix = 'stripe';
}

export class CashfreeAdapter extends BaseStubAdapter {
  readonly provider = 'cashfree' as const;
  protected readonly prefix = 'cf';
}

export class ManualAdapter extends BaseStubAdapter {
  readonly provider = 'manual' as const;
  protected readonly prefix = 'manual';

  async createPaymentIntent(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    const externalId = stubExternalId(this.prefix, input.referenceId);
    this.logger.log(`[stub] manual payment recorded ref=${input.referenceId}`);
    return {
      externalId,
      checkoutUrl: '',
      status: 'pending',
    };
  }
}

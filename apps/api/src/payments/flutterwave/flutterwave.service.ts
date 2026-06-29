import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env';

const FLW_BASE = 'https://api.flutterwave.com/v3';

export interface FlwChargeParams {
  txRef: string;
  amount: number; // whole KES
  email: string;
  phone?: string;
  redirectUrl: string;
}

export interface FlwTransferParams {
  reference: string;
  amount: number;
  phone: string; // M-PESA number for KES mobile-money transfer
  narration: string;
}

/**
 * Flutterwave adapter (cards / pan-African mobile money) over fetch. Used as an
 * alternative rail to M-PESA for both funding (charges) and payouts (transfers).
 */
@Injectable()
export class FlutterwaveService {
  private readonly logger = new Logger(FlutterwaveService.name);

  constructor(private readonly config: ConfigService<Env, true>) {}

  get isConfigured(): boolean {
    return !!this.config.get('FLW_SECRET_KEY', { infer: true });
  }

  private secret(): string {
    const v = this.config.get('FLW_SECRET_KEY', { infer: true });
    if (!v) throw new ServiceUnavailableException('Flutterwave not configured');
    return v;
  }

  /** Verifies a Flutterwave webhook by comparing the `verif-hash` header to the
   * configured secret hash (Flutterwave's documented mechanism). */
  verifyWebhook(signature: string | undefined): boolean {
    const expected = this.config.get('FLW_WEBHOOK_HASH', { infer: true });
    return !!expected && !!signature && signature === expected;
  }

  /** Creates a hosted payment link to fund a wallet. */
  async initiateCharge(params: FlwChargeParams): Promise<{ link: string }> {
    const res = await fetch(`${FLW_BASE}/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secret()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: params.txRef,
        amount: params.amount,
        currency: 'KES',
        redirect_url: params.redirectUrl,
        customer: { email: params.email, phonenumber: params.phone },
      }),
    });
    const data = (await res.json()) as {
      status: string;
      data?: { link: string };
      message?: string;
    };
    if (data.status !== 'success' || !data.data?.link) {
      this.logger.error(`FLW charge failed: ${JSON.stringify(data)}`);
      throw new ServiceUnavailableException(data.message ?? 'FLW charge failed');
    }
    return { link: data.data.link };
  }

  /** Initiates a mobile-money transfer (payout) to an agent. */
  async initiateTransfer(
    params: FlwTransferParams,
  ): Promise<{ transferId: number }> {
    const res = await fetch(`${FLW_BASE}/transfers`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secret()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_bank: 'MPS', // M-PESA
        account_number: params.phone,
        amount: params.amount,
        currency: 'KES',
        reference: params.reference,
        narration: params.narration,
      }),
    });
    const data = (await res.json()) as {
      status: string;
      data?: { id: number };
      message?: string;
    };
    if (data.status !== 'success' || !data.data?.id) {
      this.logger.error(`FLW transfer failed: ${JSON.stringify(data)}`);
      throw new ServiceUnavailableException(
        data.message ?? 'FLW transfer failed',
      );
    }
    return { transferId: data.data.id };
  }
}

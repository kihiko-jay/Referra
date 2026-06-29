import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env';
import {
  basicAuth,
  darajaBaseUrl,
  darajaTimestamp,
  stkPassword,
} from './daraja.util';

export interface StkPushParams {
  phone: string; // 2547XXXXXXXX
  amount: number; // whole KES
  accountRef: string;
  description: string;
}

export interface B2CParams {
  phone: string;
  amount: number;
  remarks: string;
  occasion?: string;
}

/**
 * Thin Daraja client over fetch. Network calls are made only when M-PESA
 * credentials are configured; otherwise a clear 503 is thrown so callers can
 * surface "payments not configured" rather than failing obscurely.
 */
@Injectable()
export class DarajaService {
  private readonly logger = new Logger(DarajaService.name);
  private tokenCache?: { token: string; expiresAt: number };

  constructor(private readonly config: ConfigService<Env, true>) {}

  get isConfigured(): boolean {
    return (
      !!this.config.get('MPESA_CONSUMER_KEY', { infer: true }) &&
      !!this.config.get('MPESA_CONSUMER_SECRET', { infer: true }) &&
      !!this.config.get('MPESA_SHORTCODE', { infer: true })
    );
  }

  private require<K extends keyof Env>(key: K): string {
    const v = this.config.get(key, { infer: true });
    if (!v) {
      throw new ServiceUnavailableException(`M-PESA not configured: ${key}`);
    }
    return String(v);
  }

  private get baseUrl(): string {
    return darajaBaseUrl(this.config.get('MPESA_ENV', { infer: true }));
  }

  private callbackUrl(path: string): string {
    const base =
      this.config.get('MPESA_CALLBACK_BASE_URL', { infer: true }) ||
      this.config.get('API_PUBLIC_URL', { infer: true });
    return `${base}/api/webhooks/mpesa/${path}`;
  }

  async getToken(): Promise<string> {
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now()) {
      return this.tokenCache.token;
    }
    const auth = basicAuth(
      this.require('MPESA_CONSUMER_KEY'),
      this.require('MPESA_CONSUMER_SECRET'),
    );
    const res = await fetch(
      `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      { headers: { Authorization: `Basic ${auth}` } },
    );
    if (!res.ok) {
      throw new ServiceUnavailableException('Daraja auth failed');
    }
    const data = (await res.json()) as {
      access_token: string;
      expires_in: string;
    };
    this.tokenCache = {
      token: data.access_token,
      // Refresh a minute before the stated expiry.
      expiresAt: Date.now() + (Number(data.expires_in) - 60) * 1000,
    };
    return data.access_token;
  }

  /** Initiates an STK push (customer pays to fund a business wallet). Returns
   * the CheckoutRequestID used to correlate the callback. */
  async stkPush(params: StkPushParams): Promise<{ checkoutRequestId: string }> {
    const token = await this.getToken();
    const shortcode = this.require('MPESA_SHORTCODE');
    const timestamp = darajaTimestamp();
    const password = stkPassword(
      shortcode,
      this.require('MPESA_PASSKEY'),
      timestamp,
    );
    const res = await fetch(
      `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          BusinessShortCode: shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: params.amount,
          PartyA: params.phone,
          PartyB: shortcode,
          PhoneNumber: params.phone,
          CallBackURL: this.callbackUrl('stk'),
          AccountReference: params.accountRef.slice(0, 12),
          TransactionDesc: params.description.slice(0, 13),
        }),
      },
    );
    const data = (await res.json()) as {
      CheckoutRequestID?: string;
      errorMessage?: string;
    };
    if (!res.ok || !data.CheckoutRequestID) {
      this.logger.error(`STK push failed: ${JSON.stringify(data)}`);
      throw new ServiceUnavailableException(
        data.errorMessage ?? 'STK push failed',
      );
    }
    return { checkoutRequestId: data.CheckoutRequestID };
  }

  /** Status query backstop — uses the correct stkpushquery path (a wrong path
   * silently 404s and sales never auto-confirm). */
  async stkQuery(checkoutRequestId: string): Promise<unknown> {
    const token = await this.getToken();
    const shortcode = this.require('MPESA_SHORTCODE');
    const timestamp = darajaTimestamp();
    const password = stkPassword(
      shortcode,
      this.require('MPESA_PASSKEY'),
      timestamp,
    );
    const res = await fetch(`${this.baseUrl}/mpesa/stkpushquery/v1/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      }),
    });
    return res.json();
  }

  /** Business-to-customer disbursement (pay an agent's commission/payout). */
  async b2c(params: B2CParams): Promise<{ conversationId: string }> {
    const token = await this.getToken();
    const res = await fetch(
      `${this.baseUrl}/mpesa/b2c/v1/paymentrequest`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          InitiatorName: this.require('MPESA_B2C_INITIATOR'),
          SecurityCredential: this.require('MPESA_B2C_SECURITY_CREDENTIAL'),
          CommandID: 'BusinessPayment',
          Amount: params.amount,
          PartyA: this.require('MPESA_SHORTCODE'),
          PartyB: params.phone,
          Remarks: params.remarks.slice(0, 100),
          QueueTimeOutURL: this.callbackUrl('b2c/timeout'),
          ResultURL: this.callbackUrl('b2c/result'),
          Occasion: params.occasion ?? 'Payout',
        }),
      },
    );
    const data = (await res.json()) as {
      ConversationID?: string;
      errorMessage?: string;
    };
    if (!res.ok || !data.ConversationID) {
      this.logger.error(`B2C failed: ${JSON.stringify(data)}`);
      throw new ServiceUnavailableException(data.errorMessage ?? 'B2C failed');
    }
    return { conversationId: data.ConversationID };
  }
}

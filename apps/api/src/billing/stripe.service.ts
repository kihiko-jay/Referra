import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SubscriptionPlan } from '@prisma/client';
import type { Env } from '../config/env';

const STRIPE_BASE = 'https://api.stripe.com/v1';

/**
 * Minimal Stripe client over fetch (no SDK): hosted Checkout for subscription
 * billing of the platform tiers, plus price<->plan mapping for webhook sync.
 */
@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);

  constructor(private readonly config: ConfigService<Env, true>) {}

  get isConfigured(): boolean {
    return !!this.config.get('STRIPE_SECRET_KEY', { infer: true });
  }

  private secret(): string {
    const v = this.config.get('STRIPE_SECRET_KEY', { infer: true });
    if (!v) throw new ServiceUnavailableException('Stripe not configured');
    return v;
  }

  private priceFor(plan: SubscriptionPlan): string {
    const map: Record<SubscriptionPlan, keyof Env> = {
      STARTER: 'STRIPE_PRICE_STARTER',
      GROWTH: 'STRIPE_PRICE_GROWTH',
      ENTERPRISE: 'STRIPE_PRICE_ENTERPRISE',
    };
    const v = this.config.get(map[plan], { infer: true });
    if (!v) throw new ServiceUnavailableException(`No Stripe price for ${plan}`);
    return String(v);
  }

  planForPrice(priceId: string): SubscriptionPlan | null {
    const entries: [SubscriptionPlan, keyof Env][] = [
      ['STARTER', 'STRIPE_PRICE_STARTER'],
      ['GROWTH', 'STRIPE_PRICE_GROWTH'],
      ['ENTERPRISE', 'STRIPE_PRICE_ENTERPRISE'],
    ];
    for (const [plan, key] of entries) {
      if (this.config.get(key, { infer: true }) === priceId) return plan;
    }
    return null;
  }

  /** Creates a subscription Checkout session for a business. */
  async createCheckoutSession(params: {
    businessId: string;
    plan: SubscriptionPlan;
    customerEmail: string;
  }): Promise<{ id: string; url: string }> {
    const web = this.config.get('WEB_PUBLIC_URL', { infer: true });
    const form = new URLSearchParams();
    form.set('mode', 'subscription');
    form.set('line_items[0][price]', this.priceFor(params.plan));
    form.set('line_items[0][quantity]', '1');
    form.set('client_reference_id', params.businessId);
    form.set('customer_email', params.customerEmail);
    form.set('success_url', `${web}/billing/success?session_id={CHECKOUT_SESSION_ID}`);
    form.set('cancel_url', `${web}/billing/cancel`);
    form.set('metadata[businessId]', params.businessId);
    form.set('metadata[plan]', params.plan);

    const res = await fetch(`${STRIPE_BASE}/checkout/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secret()}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });
    const data = (await res.json()) as {
      id?: string;
      url?: string;
      error?: { message: string };
    };
    if (!res.ok || !data.id || !data.url) {
      this.logger.error(`Stripe checkout failed: ${JSON.stringify(data)}`);
      throw new ServiceUnavailableException(
        data.error?.message ?? 'Stripe checkout failed',
      );
    }
    return { id: data.id, url: data.url };
  }
}

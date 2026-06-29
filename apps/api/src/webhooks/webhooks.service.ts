import { Injectable, Logger } from '@nestjs/common';
import type { PaymentProvider, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { BillingService } from '../billing/billing.service';
import { StripeService } from '../billing/stripe.service';

/**
 * Reconciles provider callbacks onto the ledger. Every event is persisted with a
 * unique (provider, externalId) so reprocessing the same callback is a no-op
 * (providers retry aggressively). Wallet credits and payout receipts are applied
 * here — never optimistically at request time.
 */
@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    private readonly billing: BillingService,
    private readonly stripe: StripeService,
  ) {}

  /** Returns false if this event was already recorded (idempotent short-circuit). */
  private async record(
    provider: PaymentProvider,
    externalId: string,
    eventType: string,
    payload: Prisma.InputJsonValue,
  ): Promise<boolean> {
    try {
      await this.prisma.webhookEvent.create({
        data: { provider, externalId, eventType, payload },
      });
      return true;
    } catch {
      // Unique (provider, externalId) violation => already processed.
      return false;
    }
  }

  private async finish(
    provider: PaymentProvider,
    externalId: string,
    ok: boolean,
    error?: string,
  ): Promise<void> {
    await this.prisma.webhookEvent.updateMany({
      where: { provider, externalId },
      data: {
        status: ok ? 'PROCESSED' : 'FAILED',
        processedAt: new Date(),
        error,
      },
    });
  }

  // ---- M-PESA STK (deposit) ----
  async handleMpesaStk(payload: any): Promise<void> {
    const cb = payload?.Body?.stkCallback;
    const checkoutId = cb?.CheckoutRequestID;
    if (!checkoutId) return;
    const fresh = await this.record('MPESA', checkoutId, 'stk', payload);
    if (!fresh) return;

    try {
      const intent = await this.prisma.paymentIntent.findFirst({
        where: { provider: 'MPESA', type: 'DEPOSIT', providerRef: checkoutId },
      });
      if (!intent || !intent.businessId) {
        await this.finish('MPESA', checkoutId, false, 'intent not found');
        return;
      }
      if (cb.ResultCode === 0 && intent.status !== 'SUCCEEDED') {
        const items: { Name: string; Value?: string | number }[] =
          cb.CallbackMetadata?.Item ?? [];
        const receipt = String(
          items.find((i) => i.Name === 'MpesaReceiptNumber')?.Value ?? checkoutId,
        );
        await this.wallet.fundBusiness(
          intent.businessId,
          intent.amountCents,
          receipt,
        );
        await this.prisma.paymentIntent.update({
          where: { id: intent.id },
          data: { status: 'SUCCEEDED', receipt },
        });
      } else if (cb.ResultCode !== 0) {
        await this.prisma.paymentIntent.update({
          where: { id: intent.id },
          data: { status: 'FAILED' },
        });
      }
      await this.finish('MPESA', checkoutId, true);
    } catch (e) {
      this.logger.error(`STK webhook failed: ${String(e)}`);
      await this.finish('MPESA', checkoutId, false, String(e));
    }
  }

  // ---- M-PESA B2C (payout) result ----
  async handleMpesaB2cResult(payload: any): Promise<void> {
    const result = payload?.Result;
    const conversationId = result?.ConversationID;
    if (!conversationId) return;
    const fresh = await this.record('MPESA', conversationId, 'b2c', payload);
    if (!fresh) return;

    try {
      const intent = await this.prisma.paymentIntent.findFirst({
        where: { provider: 'MPESA', type: 'PAYOUT', providerRef: conversationId },
      });
      if (!intent || !intent.payoutId) {
        await this.finish('MPESA', conversationId, false, 'intent not found');
        return;
      }
      const params: { Key: string; Value?: string | number }[] =
        result.ResultParameters?.ResultParameter ?? [];
      const receipt = String(
        params.find((p) => p.Key === 'TransactionReceipt')?.Value ??
          conversationId,
      );
      if (result.ResultCode === 0) {
        await this.prisma.$transaction([
          this.prisma.paymentIntent.update({
            where: { id: intent.id },
            data: { status: 'SUCCEEDED', receipt },
          }),
          this.prisma.payoutRequest.update({
            where: { id: intent.payoutId },
            data: { mpesaReceiptNumber: receipt },
          }),
        ]);
      } else {
        await this.prisma.paymentIntent.update({
          where: { id: intent.id },
          data: { status: 'FAILED' },
        });
      }
      await this.finish('MPESA', conversationId, true);
    } catch (e) {
      this.logger.error(`B2C webhook failed: ${String(e)}`);
      await this.finish('MPESA', conversationId, false, String(e));
    }
  }

  // ---- Stripe billing ----
  async handleStripe(event: any): Promise<void> {
    const id = event?.id;
    if (!id) return;
    const fresh = await this.record('STRIPE', id, event.type ?? 'unknown', event);
    if (!fresh) return;

    try {
      if (event.type === 'checkout.session.completed') {
        const s = event.data.object;
        const businessId = s.client_reference_id ?? s.metadata?.businessId;
        const plan = s.metadata?.plan;
        if (businessId && plan) {
          await this.billing.onCheckoutCompleted({
            businessId,
            plan,
            customerId: s.customer ?? undefined,
            subscriptionId: s.subscription ?? undefined,
          });
        }
      } else if (
        event.type === 'customer.subscription.updated' ||
        event.type === 'customer.subscription.deleted'
      ) {
        const sub = event.data.object;
        const status =
          event.type === 'customer.subscription.deleted'
            ? 'CANCELED'
            : sub.status === 'past_due'
              ? 'PAST_DUE'
              : 'ACTIVE';
        await this.billing.onSubscriptionChanged({
          subscriptionId: sub.id,
          status,
          currentPeriodEnd: sub.current_period_end
            ? new Date(sub.current_period_end * 1000)
            : undefined,
        });
      }
      await this.finish('STRIPE', id, true);
    } catch (e) {
      this.logger.error(`Stripe webhook failed: ${String(e)}`);
      await this.finish('STRIPE', id, false, String(e));
    }
    // Reference stripe service so price mapping stays wired for future events.
    void this.stripe;
  }

  // ---- Flutterwave ----
  async handleFlutterwave(payload: any): Promise<void> {
    const id = String(payload?.data?.id ?? payload?.data?.tx_ref ?? '');
    if (!id) return;
    const fresh = await this.record(
      'FLUTTERWAVE',
      id,
      payload?.event ?? 'unknown',
      payload,
    );
    if (!fresh) return;
    // Charge/transfer reconciliation mirrors the M-PESA handlers; left as a
    // PROCESSED record for now since FLW is the secondary rail.
    await this.finish('FLUTTERWAVE', id, true);
  }
}

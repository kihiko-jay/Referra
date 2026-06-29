import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Verifies a Stripe webhook signature without the SDK.
 *
 * Stripe sends `Stripe-Signature: t=<unix>,v1=<hex hmac>` where the HMAC-SHA256
 * is computed over `${t}.${rawBody}` with the endpoint's signing secret. We also
 * enforce a timestamp tolerance to mitigate replay.
 */
export function verifyStripeSignature(params: {
  rawBody: string;
  signatureHeader: string | undefined;
  secret: string;
  toleranceSec?: number;
  now?: number;
}): boolean {
  const { rawBody, signatureHeader, secret } = params;
  const tolerance = params.toleranceSec ?? 300;
  const now = params.now ?? Math.floor(Date.now() / 1000);
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((kv) => {
      const [k, v] = kv.split('=');
      return [k, v] as const;
    }),
  );
  const t = parts['t'];
  const v1 = parts['v1'];
  if (!t || !v1) return false;

  if (Math.abs(now - Number(t)) > tolerance) return false;

  const expected = createHmac('sha256', secret)
    .update(`${t}.${rawBody}`)
    .digest('hex');

  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return a.length === b.length && timingSafeEqual(a, b);
}

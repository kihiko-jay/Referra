import { createHmac } from 'crypto';
import { verifyStripeSignature } from './stripe-signature';

function sign(rawBody: string, secret: string, t: number): string {
  const v1 = createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
  return `t=${t},v1=${v1}`;
}

describe('verifyStripeSignature', () => {
  const secret = 'whsec_test';
  const body = JSON.stringify({ id: 'evt_1', type: 'checkout.session.completed' });
  const now = 1_700_000_000;

  it('accepts a valid, fresh signature', () => {
    const header = sign(body, secret, now);
    expect(
      verifyStripeSignature({ rawBody: body, signatureHeader: header, secret, now }),
    ).toBe(true);
  });

  it('rejects a tampered body', () => {
    const header = sign(body, secret, now);
    expect(
      verifyStripeSignature({
        rawBody: body + 'x',
        signatureHeader: header,
        secret,
        now,
      }),
    ).toBe(false);
  });

  it('rejects an expired timestamp', () => {
    const header = sign(body, secret, now - 10_000);
    expect(
      verifyStripeSignature({ rawBody: body, signatureHeader: header, secret, now }),
    ).toBe(false);
  });

  it('rejects a missing header', () => {
    expect(
      verifyStripeSignature({ rawBody: body, signatureHeader: undefined, secret, now }),
    ).toBe(false);
  });
});

import {
  basicAuth,
  darajaBaseUrl,
  darajaTimestamp,
  stkPassword,
} from './daraja.util';

describe('daraja util', () => {
  it('formats the timestamp as YYYYMMDDHHmmss', () => {
    const ts = darajaTimestamp(new Date(2026, 0, 9, 3, 7, 5));
    expect(ts).toBe('20260109030705');
  });

  it('builds the STK password as base64(shortcode+passkey+timestamp)', () => {
    const pwd = stkPassword('174379', 'passkey', '20260109030705');
    expect(pwd).toBe(
      Buffer.from('174379passkey20260109030705').toString('base64'),
    );
  });

  it('builds basic auth header', () => {
    expect(basicAuth('key', 'secret')).toBe(
      Buffer.from('key:secret').toString('base64'),
    );
  });

  it('selects the base URL by environment', () => {
    expect(darajaBaseUrl('sandbox')).toContain('sandbox.safaricom');
    expect(darajaBaseUrl('production')).toBe('https://api.safaricom.co.ke');
  });
});

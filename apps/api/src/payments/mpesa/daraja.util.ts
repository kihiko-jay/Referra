/**
 * Pure M-PESA Daraja helpers (kept side-effect free so they can be unit-tested
 * without network access).
 */

/** Daraja timestamp format: YYYYMMDDHHmmss (server local time). */
export function darajaTimestamp(date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}` +
    `${p(date.getMonth() + 1)}` +
    `${p(date.getDate())}` +
    `${p(date.getHours())}` +
    `${p(date.getMinutes())}` +
    `${p(date.getSeconds())}`
  );
}

/** STK push password = base64(shortcode + passkey + timestamp). */
export function stkPassword(
  shortcode: string,
  passkey: string,
  timestamp: string,
): string {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
}

/** Basic auth header value for the OAuth token request. */
export function basicAuth(consumerKey: string, consumerSecret: string): string {
  return Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
}

/** Daraja API base URL by environment. */
export function darajaBaseUrl(env: 'sandbox' | 'production'): string {
  return env === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';
}

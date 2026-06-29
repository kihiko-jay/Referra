/** Builds a human-friendly, URL-safe referral code from an agent + campaign,
 * mirroring the prototype's uniqueCode convention (e.g. "otieno-pos-referral").
 * A short random suffix guards against collisions across campaigns. */
export function buildReferralCode(
  agentName: string,
  campaignTitle: string,
): string {
  const slug = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  const first = slug(agentName).split('-')[0] || 'agent';
  const title = slug(campaignTitle).slice(0, 24) || 'campaign';
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${first}-${title}-${suffix}`;
}

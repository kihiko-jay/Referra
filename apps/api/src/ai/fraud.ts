/**
 * Deterministic fraud signals for a lead. Kept pure so it can be unit-tested
 * without a database or network. The AI layer may add a narrative on top, but
 * these rules are the gate that actually blocks payouts — never the model alone.
 */

export interface FraudInput {
  agentPhone: string;
  agentEmail: string;
  leadPhone: string;
  leadEmail: string;
  /** Other leads on the same link with the same phone in the recent window. */
  duplicatePhoneCount: number;
  /** Clicks from the same IP on the same link in the recent window. */
  sameIpClickCount: number;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface FraudResult {
  score: number; // 0-100, higher = riskier
  flags: string[];
  riskLevel: RiskLevel;
}

const norm = (s: string) => s.trim().toLowerCase().replace(/^\+/, '');

export function computeFraudSignals(input: FraudInput): FraudResult {
  const flags: string[] = [];
  let score = 0;

  const selfReferral =
    (input.agentPhone && norm(input.agentPhone) === norm(input.leadPhone)) ||
    (input.agentEmail && norm(input.agentEmail) === norm(input.leadEmail));
  if (selfReferral) {
    score += 60;
    flags.push('SELF_REFERRAL');
  }
  if (input.duplicatePhoneCount > 0) {
    score += 25;
    flags.push('DUPLICATE_PHONE');
  }
  if (input.sameIpClickCount >= 5) {
    score += 20;
    flags.push('IP_VELOCITY');
  }

  score = Math.min(100, score);
  const riskLevel: RiskLevel =
    score >= 60 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW';
  return { score, flags, riskLevel };
}

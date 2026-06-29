import type { RewardType } from '@prisma/client';

/**
 * Commission calculation, ported verbatim from the prototype's convertLead
 * (apps/web/src/context/AppContext.tsx). Kept pure so it can be unit-tested
 * without a database.
 *
 * - FIXED:      reward is a flat amount in KES (rewardValue shillings).
 * - PERCENTAGE: reward is a percentage of the sale amount.
 *
 * All amounts are in integer KES cents.
 */
export function computeCommissionCents(params: {
  rewardType: RewardType;
  rewardValue: number;
  saleAmountCents: number;
}): number {
  const { rewardType, rewardValue, saleAmountCents } = params;
  if (rewardType === 'FIXED') {
    return Math.round(rewardValue * 100);
  }
  return Math.round((saleAmountCents * rewardValue) / 100);
}

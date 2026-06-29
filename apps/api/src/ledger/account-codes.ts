import type { LedgerAccountKind } from '@prisma/client';

/**
 * Canonical ledger account codes. Per-owner accounts are namespaced by owner id;
 * platform/clearing accounts are singletons.
 */
export const AccountCodes = {
  agentAvailable: (agentId: string) => `agent:${agentId}:available`,
  agentPayoutPending: (agentId: string) => `agent:${agentId}:payout_pending`,
  businessAvailable: (businessId: string) => `business:${businessId}:available`,
  platformRevenue: () => 'platform:revenue',
  mpesaClearing: () => 'clearing:mpesa',
  flwClearing: () => 'clearing:flw',
  stripeClearing: () => 'clearing:stripe',
} as const;

export interface AccountSpec {
  code: string;
  kind: LedgerAccountKind;
  businessId?: string;
  agentId?: string;
}

export function agentAccountSpecs(agentId: string): AccountSpec[] {
  return [
    {
      code: AccountCodes.agentAvailable(agentId),
      kind: 'AGENT_AVAILABLE',
      agentId,
    },
    {
      code: AccountCodes.agentPayoutPending(agentId),
      kind: 'AGENT_PAYOUT_PENDING',
      agentId,
    },
  ];
}

export function businessAccountSpecs(businessId: string): AccountSpec[] {
  return [
    {
      code: AccountCodes.businessAvailable(businessId),
      kind: 'BUSINESS_AVAILABLE',
      businessId,
    },
  ];
}

export function platformAccountSpecs(): AccountSpec[] {
  return [
    { code: AccountCodes.platformRevenue(), kind: 'PLATFORM_REVENUE' },
    { code: AccountCodes.mpesaClearing(), kind: 'MPESA_CLEARING' },
    { code: AccountCodes.flwClearing(), kind: 'FLW_CLEARING' },
    { code: AccountCodes.stripeClearing(), kind: 'STRIPE_CLEARING' },
  ];
}

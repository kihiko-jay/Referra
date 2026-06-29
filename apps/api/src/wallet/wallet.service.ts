import { Injectable } from '@nestjs/common';
import { LedgerDirection } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import {
  AccountCodes,
  businessAccountSpecs,
} from '../ledger/account-codes';
import { toKes } from '../common/money';

export interface AgentWalletSummary {
  availableBalance: number;
  pendingApproval: number;
  payoutPending: number;
  lifetimeEarnings: number;
}

/**
 * Read models over the ledger that reproduce the prototype's Wallet shape, plus
 * the business wallet funding (deposit) entry point.
 */
@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  async agentSummary(agentId: string): Promise<AgentWalletSummary> {
    const available = await this.ledger.getBalanceCents(
      AccountCodes.agentAvailable(agentId),
    );
    const payoutPending = await this.ledger.getBalanceCents(
      AccountCodes.agentPayoutPending(agentId),
    );

    // Pending-approval commissions are derived from conversion rows.
    const pendingAgg = await this.prisma.conversion.aggregate({
      _sum: { commissionCents: true },
      where: {
        status: 'PENDING_APPROVAL',
        referralLink: { agentId },
      },
    });

    // Lifetime earnings = all commission credited into the agent's available
    // account over time.
    const account = await this.prisma.ledgerAccount.findUnique({
      where: { code: AccountCodes.agentAvailable(agentId) },
    });
    const lifetimeAgg = account
      ? await this.prisma.ledgerEntry.aggregate({
          _sum: { amountCents: true },
          where: {
            accountId: account.id,
            direction: LedgerDirection.CREDIT,
            transaction: { type: 'COMMISSION_PAYOUT' },
          },
        })
      : { _sum: { amountCents: 0 } };

    return {
      availableBalance: toKes(available),
      pendingApproval: toKes(pendingAgg._sum.commissionCents ?? 0),
      payoutPending: toKes(payoutPending),
      lifetimeEarnings: toKes(lifetimeAgg._sum.amountCents ?? 0),
    };
  }

  async businessAvailable(businessId: string): Promise<number> {
    const cents = await this.ledger.getBalanceCents(
      AccountCodes.businessAvailable(businessId),
    );
    return toKes(cents);
  }

  /** Credits a business wallet from an external deposit (e.g. M-PESA STK). */
  async fundBusiness(
    businessId: string,
    amountCents: number,
    reference: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.ledger.ensureAccounts(tx, businessAccountSpecs(businessId));
      await this.ledger.ensurePlatformAccounts(tx);
      return this.ledger.post(tx, {
        type: 'DEPOSIT',
        reference,
        description: `Wallet funding ${reference}`,
        entries: [
          {
            accountCode: AccountCodes.mpesaClearing(),
            direction: LedgerDirection.DEBIT,
            amountCents,
          },
          {
            accountCode: AccountCodes.businessAvailable(businessId),
            direction: LedgerDirection.CREDIT,
            amountCents,
          },
        ],
      });
    });
  }
}

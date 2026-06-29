import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LedgerDirection } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { AccountCodes, agentAccountSpecs } from '../ledger/account-codes';

/**
 * Ports requestPayout / processPayout from the prototype's AppContext using a
 * reserve-then-settle model on the ledger:
 *
 *  - request: holds funds (agent available -> agent payout-pending) so they
 *             can't be double-withdrawn, and creates a PENDING PayoutRequest.
 *  - process(approve):  settles the hold out to the M-PESA clearing account
 *             (the actual B2C disbursement is performed in the payments layer).
 *  - process(reject):   reverses the hold back to the agent's available balance.
 */
@Injectable()
export class PayoutsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  async requestPayout(agentId: string, amountCents: number) {
    if (amountCents <= 0) {
      throw new BadRequestException('Amount must be positive');
    }
    return this.prisma.$transaction(async (tx) => {
      const agent = await tx.agent.findUnique({ where: { id: agentId } });
      if (!agent) throw new NotFoundException('Agent not found');

      await this.ledger.ensureAccounts(tx, agentAccountSpecs(agentId));
      const available = await this.ledger.getBalanceCents(
        AccountCodes.agentAvailable(agentId),
        tx,
      );
      if (available < amountCents) {
        throw new BadRequestException('Insufficient available balance');
      }

      const payout = await tx.payoutRequest.create({
        data: {
          agentId,
          amountCents,
          mpesaNumber: agent.mpesaNumber,
          status: 'PENDING',
        },
      });

      const { transactionId } = await this.ledger.post(tx, {
        type: 'PAYOUT_HOLD',
        reference: `payout:${payout.id}`,
        description: `Hold for payout ${payout.id}`,
        entries: this.ledger.transfer(
          AccountCodes.agentAvailable(agentId),
          AccountCodes.agentPayoutPending(agentId),
          amountCents,
        ),
      });

      return tx.payoutRequest.update({
        where: { id: payout.id },
        data: { holdTxnId: transactionId },
      });
    });
  }

  async processPayout(
    payoutId: string,
    approve: boolean,
    opts: { mpesaReceiptNumber?: string } = {},
  ) {
    return this.prisma.$transaction(async (tx) => {
      const payout = await tx.payoutRequest.findUnique({
        where: { id: payoutId },
      });
      if (!payout) throw new NotFoundException('Payout not found');
      if (payout.status !== 'PENDING') {
        throw new BadRequestException('Payout is not pending');
      }

      await this.ledger.ensureAccounts(tx, agentAccountSpecs(payout.agentId));
      await this.ledger.ensurePlatformAccounts(tx);

      if (approve) {
        const { transactionId } = await this.ledger.post(tx, {
          type: 'PAYOUT_SETTLE',
          reference: `payout:${payout.id}`,
          description: `Settle payout ${payout.id} to M-PESA`,
          entries: [
            {
              accountCode: AccountCodes.agentPayoutPending(payout.agentId),
              direction: LedgerDirection.DEBIT,
              amountCents: payout.amountCents,
            },
            {
              accountCode: AccountCodes.mpesaClearing(),
              direction: LedgerDirection.CREDIT,
              amountCents: payout.amountCents,
            },
          ],
        });
        return tx.payoutRequest.update({
          where: { id: payout.id },
          data: {
            status: 'APPROVED',
            completedAt: new Date(),
            settleTxnId: transactionId,
            mpesaReceiptNumber: opts.mpesaReceiptNumber,
          },
        });
      }

      const { transactionId } = await this.ledger.post(tx, {
        type: 'PAYOUT_REVERSE',
        reference: `payout:${payout.id}`,
        description: `Reverse payout ${payout.id}`,
        entries: this.ledger.transfer(
          AccountCodes.agentPayoutPending(payout.agentId),
          AccountCodes.agentAvailable(payout.agentId),
          payout.amountCents,
        ),
      });
      return tx.payoutRequest.update({
        where: { id: payout.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          settleTxnId: transactionId,
        },
      });
    });
  }
}

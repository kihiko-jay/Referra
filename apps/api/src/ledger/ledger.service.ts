import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  LedgerDirection,
  LedgerTxnType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AccountCodes,
  type AccountSpec,
  platformAccountSpecs,
} from './account-codes';

export interface EntryInput {
  accountCode: string;
  direction: LedgerDirection;
  amountCents: number;
}

export interface PostTxnInput {
  type: LedgerTxnType;
  reference: string;
  description: string;
  metadata?: Prisma.InputJsonValue;
  entries: EntryInput[];
}

/**
 * The double-entry ledger. Every value movement is recorded as a balanced
 * transaction (sum of debits === sum of credits). Account balances are
 * materialized in lockstep within the same DB transaction. Convention: a CREDIT
 * increases an account's balance, a DEBIT decreases it.
 *
 * All mutating methods take a Prisma.TransactionClient so callers can compose
 * ledger postings atomically with their own domain writes.
 */
@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  /** Idempotently create the singleton platform/clearing accounts. */
  async ensurePlatformAccounts(
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    await this.ensureAccounts(tx, platformAccountSpecs());
  }

  async ensureAccounts(
    tx: Prisma.TransactionClient,
    specs: AccountSpec[],
  ): Promise<void> {
    if (specs.length === 0) return;
    await tx.ledgerAccount.createMany({ data: specs, skipDuplicates: true });
  }

  /** Posts a balanced transaction and updates materialized balances. */
  async post(
    tx: Prisma.TransactionClient,
    input: PostTxnInput,
  ): Promise<{ transactionId: string }> {
    if (input.entries.length < 2) {
      throw new BadRequestException('A ledger transaction needs >= 2 entries');
    }

    let debit = 0;
    let credit = 0;
    for (const e of input.entries) {
      if (!Number.isInteger(e.amountCents) || e.amountCents <= 0) {
        throw new BadRequestException('Entry amounts must be positive integers');
      }
      if (e.direction === LedgerDirection.DEBIT) debit += e.amountCents;
      else credit += e.amountCents;
    }
    if (debit !== credit) {
      throw new BadRequestException(
        `Unbalanced ledger transaction: debit ${debit} !== credit ${credit}`,
      );
    }

    const accounts = await tx.ledgerAccount.findMany({
      where: { code: { in: input.entries.map((e) => e.accountCode) } },
    });
    const byCode = new Map(accounts.map((a) => [a.code, a]));
    for (const e of input.entries) {
      if (!byCode.has(e.accountCode)) {
        throw new NotFoundException(`Ledger account not found: ${e.accountCode}`);
      }
    }

    const txn = await tx.ledgerTransaction.create({
      data: {
        type: input.type,
        reference: input.reference,
        description: input.description,
        metadata: input.metadata,
        entries: {
          create: input.entries.map((e) => ({
            accountId: byCode.get(e.accountCode)!.id,
            direction: e.direction,
            amountCents: e.amountCents,
          })),
        },
      },
    });

    for (const e of input.entries) {
      const delta =
        e.direction === LedgerDirection.CREDIT ? e.amountCents : -e.amountCents;
      await tx.ledgerAccount.update({
        where: { id: byCode.get(e.accountCode)!.id },
        data: { balanceCents: { increment: delta } },
      });
    }

    return { transactionId: txn.id };
  }

  async getBalanceCents(
    code: string,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<number> {
    const account = await tx.ledgerAccount.findUnique({ where: { code } });
    return account?.balanceCents ?? 0;
  }

  /** Reusable balanced-transfer convenience for the common A->B case. */
  transfer(
    from: string,
    to: string,
    amountCents: number,
  ): EntryInput[] {
    return [
      { accountCode: from, direction: LedgerDirection.DEBIT, amountCents },
      { accountCode: to, direction: LedgerDirection.CREDIT, amountCents },
    ];
  }

  readonly codes = AccountCodes;
}

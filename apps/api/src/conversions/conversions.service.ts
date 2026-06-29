import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LedgerDirection } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService, type EntryInput } from '../ledger/ledger.service';
import {
  AccountCodes,
  agentAccountSpecs,
  businessAccountSpecs,
} from '../ledger/account-codes';
import { computeCommissionCents } from './commission';
import type { Env } from '../config/env';

/**
 * Ports the lead -> conversion -> approval flow from the prototype's
 * AppContext (convertLead / approveConversion / rejectConversion), with the
 * same invariants but backed by transactional ledger postings:
 *
 *  - convert:  records a PENDING_APPROVAL conversion; no money moves yet
 *              (the agent's "pending" balance is derived from these rows).
 *  - approve:  moves commission business -> agent (+ platform fee) atomically,
 *              guarded by the business's available balance. Marks it PAID.
 *  - reject:   marks REJECTED; nothing to reverse since approve hadn't run.
 */
@Injectable()
export class ConversionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async listForBusinesses(businessIds: string[]) {
    return this.prisma.conversion.findMany({
      where: {
        referralLink: { campaign: { businessId: { in: businessIds } } },
      },
      include: {
        lead: { select: { customerName: true } },
        referralLink: {
          include: {
            agent: { include: { user: { select: { name: true } } } },
            campaign: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async convertLead(
    leadId: string,
    customAmountCents?: number,
    ownerBusinessIds?: string[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({
        where: { id: leadId },
        include: {
          referralLink: { include: { campaign: true } },
          conversion: true,
        },
      });
      if (!lead) throw new NotFoundException('Lead not found');
      if (lead.status !== 'PENDING') {
        throw new BadRequestException('Lead is not pending conversion');
      }
      const campaign = lead.referralLink.campaign;
      if (ownerBusinessIds && !ownerBusinessIds.includes(campaign.businessId)) {
        throw new ForbiddenException('Not your lead');
      }
      const saleAmountCents = customAmountCents ?? campaign.productPriceCents;
      const commissionCents = computeCommissionCents({
        rewardType: campaign.rewardType,
        rewardValue: campaign.rewardValue,
        saleAmountCents,
      });

      const conversion = await tx.conversion.create({
        data: {
          leadId: lead.id,
          referralLinkId: lead.referralLinkId,
          amountCents: saleAmountCents,
          commissionCents,
          status: 'PENDING_APPROVAL',
        },
      });
      await tx.lead.update({
        where: { id: lead.id },
        data: { status: 'CONVERTED' },
      });
      return conversion;
    });
  }

  async approveConversion(conversionId: string, ownerBusinessIds?: string[]) {
    const feeBps = this.config.get('PLATFORM_FEE_BPS', { infer: true });

    return this.prisma.$transaction(async (tx) => {
      const conv = await tx.conversion.findUnique({
        where: { id: conversionId },
        include: {
          referralLink: { include: { campaign: true } },
        },
      });
      if (!conv) throw new NotFoundException('Conversion not found');
      if (conv.status !== 'PENDING_APPROVAL') {
        throw new BadRequestException('Conversion is not awaiting approval');
      }

      const businessId = conv.referralLink.campaign.businessId;
      const agentId = conv.referralLink.agentId;
      if (ownerBusinessIds && !ownerBusinessIds.includes(businessId)) {
        throw new ForbiddenException('Not your campaign');
      }

      // Ensure all involved accounts exist (seeded agents/businesses included).
      await this.ledger.ensureAccounts(tx, [
        ...businessAccountSpecs(businessId),
        ...agentAccountSpecs(agentId),
      ]);
      await this.ledger.ensurePlatformAccounts(tx);

      const commission = conv.commissionCents;
      const fee = Math.round((commission * feeBps) / 10_000);
      const total = commission + fee;

      const bizAccount = AccountCodes.businessAvailable(businessId);
      const balance = await this.ledger.getBalanceCents(bizAccount, tx);
      if (balance < total) {
        throw new BadRequestException(
          `Insufficient business balance: need ${total} cents, have ${balance}`,
        );
      }

      const entries: EntryInput[] = [
        {
          accountCode: bizAccount,
          direction: LedgerDirection.DEBIT,
          amountCents: total,
        },
        {
          accountCode: AccountCodes.agentAvailable(agentId),
          direction: LedgerDirection.CREDIT,
          amountCents: commission,
        },
      ];
      if (fee > 0) {
        entries.push({
          accountCode: AccountCodes.platformRevenue(),
          direction: LedgerDirection.CREDIT,
          amountCents: fee,
        });
      }

      const { transactionId } = await this.ledger.post(tx, {
        type: 'COMMISSION_PAYOUT',
        reference: `conv:${conv.id}`,
        description: `Commission for conversion ${conv.id}`,
        metadata: { conversionId: conv.id, commission, fee },
        entries,
      });

      return tx.conversion.update({
        where: { id: conv.id },
        data: {
          status: 'PAID',
          approvedAt: new Date(),
          ledgerTransactionId: transactionId,
        },
      });
    });
  }

  async rejectConversion(conversionId: string, ownerBusinessIds?: string[]) {
    return this.prisma.$transaction(async (tx) => {
      const conv = await tx.conversion.findUnique({
        where: { id: conversionId },
        include: { referralLink: { include: { campaign: true } } },
      });
      if (!conv) throw new NotFoundException('Conversion not found');
      if (conv.status !== 'PENDING_APPROVAL') {
        throw new BadRequestException('Conversion is not awaiting approval');
      }
      if (
        ownerBusinessIds &&
        !ownerBusinessIds.includes(conv.referralLink.campaign.businessId)
      ) {
        throw new ForbiddenException('Not your campaign');
      }
      return tx.conversion.update({
        where: { id: conv.id },
        data: { status: 'REJECTED' },
      });
    });
  }
}

import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from './ledger.service';
import { ConversionsService } from '../conversions/conversions.service';
import { PayoutsService } from '../payouts/payouts.service';
import { WalletService } from '../wallet/wallet.service';

/**
 * Golden test for the money state machine. Runs against a real Postgres
 * (skipped automatically when DATABASE_URL is not set so `pnpm test` stays
 * green in environments without a DB).
 *
 *   DATABASE_URL=postgresql://... pnpm --filter @referraios/api test
 *
 * Core invariant asserted throughout: because every ledger transaction is
 * balanced (sum of credits === sum of debits), the sum of ALL account balances
 * is always exactly zero.
 */
const hasDb = !!process.env.DATABASE_URL;
const describeDb = hasDb ? describe : describe.skip;

describeDb('ledger money state machine (integration)', () => {
  const prisma = new PrismaService();
  const ledger = new LedgerService(prisma);
  // PLATFORM_FEE_BPS = 0 for this scenario.
  const config = { get: () => 0 } as never;
  const conversions = new ConversionsService(prisma, ledger, config);
  const payouts = new PayoutsService(prisma, ledger);
  const wallet = new WalletService(prisma, ledger);

  const s = Date.now();
  let businessId = '';
  let agentId = '';
  let leadId = '';

  async function totalOfAllBalances(): Promise<number> {
    const agg = await prisma.ledgerAccount.aggregate({
      _sum: { balanceCents: true },
    });
    return agg._sum.balanceCents ?? 0;
  }

  beforeAll(async () => {
    const owner = await prisma.user.create({
      data: {
        name: 'Owner',
        email: `owner+${s}@test.com`,
        role: 'BUSINESS_OWNER',
        passwordHash: 'x',
      },
    });
    const business = await prisma.business.create({
      data: {
        name: 'Biz',
        industry: 'SaaS',
        location: 'Nairobi',
        website: 'https://x.co',
        ownerId: owner.id,
      },
    });
    businessId = business.id;

    const agentUser = await prisma.user.create({
      data: {
        name: 'Agent',
        email: `agent+${s}@test.com`,
        role: 'AGENT',
        passwordHash: 'x',
      },
    });
    const agent = await prisma.agent.create({
      data: { userId: agentUser.id, status: 'ACTIVE', mpesaNumber: '254712000000' },
    });
    agentId = agent.id;

    const campaign = await prisma.campaign.create({
      data: {
        businessId,
        title: 'POS Referral',
        description: 'Refer merchants',
        rewardType: 'FIXED',
        rewardValue: 3500,
        productPriceCents: 15_000_00,
        terms: 'x',
        status: 'ACTIVE',
        expiryDate: new Date(Date.now() + 1e10),
      },
    });
    const link = await prisma.referralLink.create({
      data: { campaignId: campaign.id, agentId, uniqueCode: `code-${s}` },
    });
    const lead = await prisma.lead.create({
      data: {
        referralLinkId: link.id,
        customerName: 'Cust',
        customerEmail: `cust+${s}@test.com`,
        customerPhone: '254700000000',
        status: 'PENDING',
      },
    });
    leadId = lead.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('funds the business wallet via a deposit', async () => {
    await wallet.fundBusiness(businessId, 10_000_00, `dep-${s}`);
    expect(await wallet.businessAvailable(businessId)).toBe(10_000);
    expect(await totalOfAllBalances()).toBe(0);
  });

  it('converting a lead records a pending-approval commission (no money moves)', async () => {
    await conversions.convertLead(leadId);
    const summary = await wallet.agentSummary(agentId);
    expect(summary.pendingApproval).toBe(3500);
    expect(summary.availableBalance).toBe(0);
    expect(await totalOfAllBalances()).toBe(0);
  });

  it('approving moves commission business -> agent atomically', async () => {
    const conv = await prisma.conversion.findFirstOrThrow({
      where: { referralLink: { agentId } },
    });
    await conversions.approveConversion(conv.id);

    expect(await wallet.businessAvailable(businessId)).toBe(10_000 - 3500);
    const summary = await wallet.agentSummary(agentId);
    expect(summary.availableBalance).toBe(3500);
    expect(summary.pendingApproval).toBe(0);
    expect(summary.lifetimeEarnings).toBe(3500);
    expect(await totalOfAllBalances()).toBe(0);
  });

  it('rejects a payout that exceeds available balance', async () => {
    await expect(payouts.requestPayout(agentId, 9_999_00)).rejects.toThrow(
      /Insufficient/,
    );
  });

  it('holds funds on payout request and settles on approval', async () => {
    const payout = await payouts.requestPayout(agentId, 3500_00);
    let summary = await wallet.agentSummary(agentId);
    expect(summary.availableBalance).toBe(0);
    expect(summary.payoutPending).toBe(3500);

    await payouts.processPayout(payout.id, true, {
      mpesaReceiptNumber: 'TEST123',
    });
    summary = await wallet.agentSummary(agentId);
    expect(summary.payoutPending).toBe(0);
    expect(await totalOfAllBalances()).toBe(0);
  });

  it('reverses a held payout back to available on rejection', async () => {
    // Credit the agent again via a fresh conversion so there are funds to hold.
    const link = await prisma.referralLink.findFirstOrThrow({
      where: { agentId },
    });
    const lead2 = await prisma.lead.create({
      data: {
        referralLinkId: link.id,
        customerName: 'Cust2',
        customerEmail: `cust2+${s}@test.com`,
        customerPhone: '254700000001',
        status: 'PENDING',
      },
    });
    const conv2 = await conversions.convertLead(lead2.id);
    await conversions.approveConversion(conv2.id);
    expect((await wallet.agentSummary(agentId)).availableBalance).toBe(3500);

    const payout = await payouts.requestPayout(agentId, 3500_00);
    expect((await wallet.agentSummary(agentId)).payoutPending).toBe(3500);

    await payouts.processPayout(payout.id, false);
    const summary = await wallet.agentSummary(agentId);
    expect(summary.payoutPending).toBe(0);
    expect(summary.availableBalance).toBe(3500);
    expect(await totalOfAllBalances()).toBe(0);
  });
});

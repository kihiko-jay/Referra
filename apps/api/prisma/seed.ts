/**
 * Dev/demo seed, ported from the prototype's apps/web/src/data.ts.
 *
 * Creates the platform admin, two businesses (funded via real ledger deposits),
 * two active agents, three campaigns (which auto-provision referral links), and
 * a handful of pending leads so the convert -> approve -> payout flow can be
 * demonstrated live. All demo accounts share the password "password123".
 *
 * Run: DATABASE_URL=... pnpm --filter @referraios/api seed
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { LedgerService } from '../src/ledger/ledger.service';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  agentAccountSpecs,
  businessAccountSpecs,
  AccountCodes,
} from '../src/ledger/account-codes';
import { buildReferralCode } from '../src/referral-links/code';

const prisma = new PrismaClient();
const ledger = new LedgerService(new PrismaService());

const toCents = (kes: number) => kes * 100;

async function reset() {
  // Delete in FK-dependency order.
  await prisma.ledgerEntry.deleteMany();
  await prisma.ledgerTransaction.deleteMany();
  await prisma.ledgerAccount.deleteMany();
  await prisma.conversion.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.click.deleteMany();
  await prisma.referralLink.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.payoutRequest.deleteMany();
  await prisma.paymentIntent.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.business.deleteMany();
  await prisma.aiInteraction.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await reset();
  const passwordHash = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.create({
    data: {
      name: 'Amina Patel',
      email: 'amina@referraios.co.ke',
      phone: '254701234567',
      role: 'ADMIN',
      passwordHash,
      emailVerifiedAt: new Date(),
    },
  });

  // --- Businesses + owners ---
  const kamau = await prisma.user.create({
    data: {
      name: 'Kamau Wafula',
      email: 'kamau@pesapos.com',
      phone: '254711223344',
      role: 'BUSINESS_OWNER',
      passwordHash,
      emailVerifiedAt: new Date(),
    },
  });
  const nekesa = await prisma.user.create({
    data: {
      name: 'Nekesa Simiyu',
      email: 'nekesa@solarspark.co.ke',
      phone: '254722556677',
      role: 'BUSINESS_OWNER',
      passwordHash,
      emailVerifiedAt: new Date(),
    },
  });

  const pesapos = await prisma.business.create({
    data: {
      name: 'PesaPOS Solutions',
      industry: 'Financial & SaaS Services',
      location: 'Westlands, Nairobi',
      website: 'https://pesapos.co.ke',
      mpesaTillNumber: '5544332',
      subscriptionPlan: 'GROWTH',
      ownerId: kamau.id,
    },
  });
  const solar = await prisma.business.create({
    data: {
      name: 'SolarSpark East Africa',
      industry: 'Renewable Energy',
      location: 'Industrial Area, Nairobi',
      website: 'https://solarspark.africa',
      mpesaTillNumber: '123098',
      subscriptionPlan: 'STARTER',
      ownerId: nekesa.id,
    },
  });

  // --- Agents ---
  const otienoUser = await prisma.user.create({
    data: {
      name: 'Otieno Onyango',
      email: 'otieno.sales@gmail.com',
      phone: '254712345678',
      role: 'AGENT',
      passwordHash,
      emailVerifiedAt: new Date(),
    },
  });
  const fatumaUser = await prisma.user.create({
    data: {
      name: 'Fatuma Ali',
      email: 'fatuma.ali@gmail.com',
      phone: '254798765432',
      role: 'AGENT',
      passwordHash,
      emailVerifiedAt: new Date(),
    },
  });
  const otieno = await prisma.agent.create({
    data: {
      userId: otienoUser.id,
      status: 'ACTIVE',
      mpesaNumber: '254712345678',
      rating: 4.9,
    },
  });
  const fatuma = await prisma.agent.create({
    data: {
      userId: fatumaUser.id,
      status: 'ACTIVE',
      mpesaNumber: '254798765432',
      rating: 4.6,
    },
  });

  // --- Ledger accounts + opening business balances (via real deposits) ---
  await ledger.ensurePlatformAccounts(prisma);
  await ledger.ensureAccounts(prisma, [
    ...businessAccountSpecs(pesapos.id),
    ...businessAccountSpecs(solar.id),
    ...agentAccountSpecs(otieno.id),
    ...agentAccountSpecs(fatuma.id),
  ]);
  await ledger.post(prisma, {
    type: 'DEPOSIT',
    reference: 'seed:pesapos',
    description: 'Opening balance',
    entries: [
      { accountCode: AccountCodes.mpesaClearing(), direction: 'DEBIT', amountCents: toCents(85000) },
      { accountCode: AccountCodes.businessAvailable(pesapos.id), direction: 'CREDIT', amountCents: toCents(85000) },
    ],
  });
  await ledger.post(prisma, {
    type: 'DEPOSIT',
    reference: 'seed:solar',
    description: 'Opening balance',
    entries: [
      { accountCode: AccountCodes.mpesaClearing(), direction: 'DEBIT', amountCents: toCents(32000) },
      { accountCode: AccountCodes.businessAvailable(solar.id), direction: 'CREDIT', amountCents: toCents(32000) },
    ],
  });

  // --- Campaigns ---
  const merchant = await prisma.campaign.create({
    data: {
      businessId: pesapos.id,
      title: 'Android Smart POS Referral',
      description:
        'Refer retail shop owners, pharmacies, or supermarkets to get our Android Smart POS terminal.',
      rewardType: 'FIXED',
      rewardValue: 3500,
      productPriceCents: toCents(15000),
      terms: 'Paid via M-Pesa once the merchant receives their terminal and processes a first test payment.',
      status: 'ACTIVE',
      expiryDate: new Date(Date.now() + 120 * 864e5),
    },
  });
  const solarKit = await prisma.campaign.create({
    data: {
      businessId: solar.id,
      title: 'EcoSmart Offgrid Solar Kit',
      description: 'Promote EcoSmart home battery & solar lighting systems.',
      rewardType: 'PERCENTAGE',
      rewardValue: 8,
      productPriceCents: toCents(45000),
      terms: 'Commission processed once the customer pays the KES 5,000 deposit.',
      status: 'ACTIVE',
      expiryDate: new Date(Date.now() + 45 * 864e5),
    },
  });

  // --- Referral links for both agents on both campaigns ---
  const linkData = [
    { c: merchant, a: otieno, name: 'Otieno Onyango' },
    { c: merchant, a: fatuma, name: 'Fatuma Ali' },
    { c: solarKit, a: otieno, name: 'Otieno Onyango' },
    { c: solarKit, a: fatuma, name: 'Fatuma Ali' },
  ];
  const links = [];
  for (const l of linkData) {
    links.push(
      await prisma.referralLink.create({
        data: {
          campaignId: l.c.id,
          agentId: l.a.id,
          uniqueCode: buildReferralCode(l.name, l.c.title),
        },
      }),
    );
  }

  // --- A few pending leads to demo convert -> approve -> payout ---
  await prisma.lead.createMany({
    data: [
      {
        referralLinkId: links[0]!.id,
        customerName: 'Wycliffe Mwangi',
        customerEmail: 'wycliffe@mwangistores.co.ke',
        customerPhone: '254705112233',
        notes: 'Owner of Mwangi Wholesalers in Thika. Needs 2 POS terminals.',
        status: 'PENDING',
      },
      {
        referralLinkId: links[2]!.id,
        customerName: 'Charles Ochieng',
        customerEmail: 'charles.ochieng.farm@gmail.com',
        customerPhone: '254722334455',
        notes: 'Requires EcoSmart solar installation in Homabay.',
        status: 'PENDING',
      },
    ],
  });

  console.log('Seed complete.');
  console.log('  Admin:    amina@referraios.co.ke / password123');
  console.log('  Business: kamau@pesapos.com / password123');
  console.log('  Agent:    otieno.sales@gmail.com / password123');
  console.log(`  Sample referral codes: ${links.map((l) => l.uniqueCode).join(', ')}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

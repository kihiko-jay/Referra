/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Business, Agent, Campaign, ReferralLink, Click, Lead, Conversion, Wallet, WalletTransaction, PayoutRequest } from "./types";

// Helper to generate recent date strings
const minutesAgo = (min: number) => new Date(Date.now() - min * 60 * 1000).toISOString();
const hoursAgo = (hr: number) => new Date(Date.now() - hr * 60 * 60 * 1000).toISOString();
const daysAgo = (day: number) => new Date(Date.now() - day * 24 * 60 * 60 * 1000).toISOString();

export const INITIAL_USERS: User[] = [
  {
    id: "user_admin",
    name: "Amina Patel",
    email: "amina@referraios.co.ke",
    role: "ADMIN",
    phone: "254701234567",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&q=80"
  },
  {
    id: "user_owner_pesapos",
    name: "Kamau Wafula",
    email: "kamau@pesapos.com",
    role: "BUSINESS_OWNER",
    phone: "254711223344",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&q=80"
  },
  {
    id: "user_owner_solar",
    name: "Nekesa Simiyu",
    email: "nekesa@solarspark.co.ke",
    role: "BUSINESS_OWNER",
    phone: "254722556677",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80"
  },
  {
    id: "user_agent_otieno",
    name: "Otieno Onyango",
    email: "otieno.sales@gmail.com",
    role: "AGENT",
    phone: "254712345678",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&q=80"
  },
  {
    id: "user_agent_fatuma",
    name: "Fatuma Ali",
    email: "fatuma.ali@gmail.com",
    role: "AGENT",
    phone: "254798765432",
    avatarUrl: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&h=150&fit=crop&q=80"
  }
];

export const INITIAL_BUSINESSES: Business[] = [
  {
    id: "biz_pesapos",
    name: "PesaPOS Solutions",
    industry: "Financial & SaaS Services",
    location: "Westlands, Nairobi",
    website: "https://pesapos.co.ke",
    mpesaTillNumber: "5544332",
    subscriptionPlan: "GROWTH",
    balance: 85000 // In KES
  },
  {
    id: "biz_solarspark",
    name: "SolarSpark East Africa",
    industry: "Renewable Energy",
    location: "Industrial Area, Nairobi",
    website: "https://solarspark.africa",
    mpesaTillNumber: "123098",
    subscriptionPlan: "STARTER",
    balance: 32000
  }
];

export const INITIAL_AGENTS: Agent[] = [
  {
    id: "agent_otieno",
    userId: "user_agent_otieno",
    name: "Otieno Onyango",
    email: "otieno.sales@gmail.com",
    phone: "254712345678",
    joinedDate: daysAgo(45),
    status: "ACTIVE",
    mpesaNumber: "254712345678",
    rating: 4.9
  },
  {
    id: "agent_fatuma",
    userId: "user_agent_fatuma",
    name: "Fatuma Ali",
    email: "fatuma.ali@gmail.com",
    phone: "254798765432",
    joinedDate: daysAgo(20),
    status: "ACTIVE",
    mpesaNumber: "254798765432",
    rating: 4.6
  }
];

export const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: "camp_pesapos_merchant",
    businessId: "biz_pesapos",
    businessName: "PesaPOS Solutions",
    title: "Android Smart POS Referral",
    description: "Refer retail shop owners, pharmacies, or supermarkets to get our Android Smart POS terminal with automated merchant reconciliation. Terminals are setup at KES 15,000 setup fee.",
    rewardType: "FIXED",
    rewardValue: 3500, // KES 3,500 cash commission per approved merchant
    productPrice: 15000,
    terms: "Award is paid automatically via M-Pesa once the merchant accepts delivery, receives their terminal on site, and processes a first test payment.",
    status: "ACTIVE",
    expiryDate: daysAgo(-120),
    clicksCount: 245,
    leadsCount: 34,
    conversionsCount: 12
  },
  {
    id: "camp_pesapos_payroll",
    businessId: "biz_pesapos",
    businessName: "PesaPOS Solutions",
    title: "SME Payroll Software Onboarding",
    description: "Our secure HR & payroll software. Refer any enterprise or growing company with 10+ employees.",
    rewardType: "PERCENTAGE",
    rewardValue: 15, // 15% of annual license pricing
    productPrice: 80000, // Annual average package
    terms: "Commission earned on signing of license contract. Paid instantly to agent wallet.",
    status: "ACTIVE",
    expiryDate: daysAgo(-60),
    clicksCount: 112,
    leadsCount: 18,
    conversionsCount: 4
  },
  {
    id: "camp_solar_home_kit",
    businessId: "biz_solarspark",
    businessName: "SolarSpark East Africa",
    title: "EcoSmart Offgrid Solar Kit sale",
    description: "Promote EcoSmart home battery & solar lighting systems for rural and peri-urban locations without access to regular electricity.",
    rewardType: "PERCENTAGE",
    rewardValue: 8, // 8% of standard Solar Home System (KES 45,000)
    productPrice: 45000,
    terms: "Commission calculations are processed instantly once the customer pays the deposit of KES 5,000 on delivery and installs.",
    status: "ACTIVE",
    expiryDate: daysAgo(-45),
    clicksCount: 189,
    leadsCount: 22,
    conversionsCount: 7
  }
];

export const INITIAL_REFERRAL_LINKS: ReferralLink[] = [
  {
    id: "link_pesapos_otieno",
    campaignId: "camp_pesapos_merchant",
    agentId: "agent_otieno",
    uniqueCode: "otieno-pesapos",
    clicksCount: 160,
    leadsCount: 24,
    conversionsCount: 9
  },
  {
    id: "link_pesapos_fatuma",
    campaignId: "camp_pesapos_merchant",
    agentId: "agent_fatuma",
    uniqueCode: "fatuma-pesapos",
    clicksCount: 85,
    leadsCount: 10,
    conversionsCount: 3
  },
  {
    id: "link_solar_otieno",
    campaignId: "camp_solar_home_kit",
    agentId: "agent_otieno",
    uniqueCode: "otieno-solarspark",
    clicksCount: 120,
    leadsCount: 15,
    conversionsCount: 5
  },
  {
    id: "link_solar_fatuma",
    campaignId: "camp_solar_home_kit",
    agentId: "agent_fatuma",
    uniqueCode: "fatuma-solarspark",
    clicksCount: 69,
    leadsCount: 7,
    conversionsCount: 2
  }
];

export const INITIAL_CLICKS: Click[] = [
  { id: "click_1", referralLinkId: "link_pesapos_otieno", timestamp: minutesAgo(5), ipAddress: "197.248.34.11", userAgent: "Mozilla/iPhone", location: "Nairobi, KE" },
  { id: "click_2", referralLinkId: "link_pesapos_otieno", timestamp: hoursAgo(2), ipAddress: "196.250.22.4", userAgent: "Mozilla/Chrome", location: "Mombasa, KE" },
  { id: "click_3", referralLinkId: "link_solar_otieno", timestamp: hoursAgo(4), ipAddress: "41.80.90.3", userAgent: "Mozilla/Android", location: "Kisumu, KE" },
  { id: "click_4", referralLinkId: "link_pesapos_fatuma", timestamp: hoursAgo(12), ipAddress: "105.16.12.98", userAgent: "Mozilla/Safari", location: "Eldoret, KE" },
  { id: "click_5", referralLinkId: "link_solar_fatuma", timestamp: daysAgo(1), ipAddress: "102.219.208.12", userAgent: "Mozilla/Chrome", location: "Nakuru, KE" },
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: "lead_1",
    referralLinkId: "link_pesapos_otieno",
    customerName: "Wycliffe Mwangi",
    customerEmail: "wycliffe@mwangistores.co.ke",
    customerPhone: "254705112233",
    timestamp: hoursAgo(3),
    status: "PENDING",
    notes: "Owner of Mwangi Wholesalers in Thika. Needs 2 portable POS terminals."
  },
  {
    id: "lead_2",
    referralLinkId: "link_pesapos_otieno",
    customerName: "Dr. Catherine Nekesa",
    customerEmail: "nekesa@morningsidepharmacy.com",
    customerPhone: "254711889900",
    timestamp: daysAgo(1),
    status: "CONVERTED",
    notes: "Morningside Pharmacy. Setup approved."
  },
  {
    id: "lead_3",
    referralLinkId: "link_solar_otieno",
    customerName: "Charles Ochieng",
    customerEmail: "charles.ochieng.farm@gmail.com",
    customerPhone: "254722334455",
    timestamp: daysAgo(2),
    status: "CONVERTED",
    notes: "Requires EcoSmart solar installation at farm in Homabay."
  },
  {
    id: "lead_4",
    referralLinkId: "link_pesapos_fatuma",
    customerName: "Halima Bakari",
    customerEmail: "halima.boutique@gmail.com",
    customerPhone: "254755123987",
    timestamp: daysAgo(3),
    status: "DISQUALIFIED",
    notes: "Decided subscription fee was too high, wanted a free alternative."
  },
  {
    id: "lead_5",
    referralLinkId: "link_solar_fatuma",
    customerName: "Daniel Kosgei",
    customerEmail: "daniel.kosgei@yahoo.com",
    customerPhone: "254744567890",
    timestamp: daysAgo(4),
    status: "CONVERTED",
    notes: "Purchased EcoSmart battery system kit."
  }
];

export const INITIAL_CONVERSIONS: Conversion[] = [
  {
    id: "conv_1",
    leadId: "lead_2",
    referralLinkId: "link_pesapos_otieno",
    amount: 15000,
    commissionEarned: 3500,
    timestamp: daysAgo(1),
    status: "APPROVED"
  },
  {
    id: "conv_2",
    leadId: "lead_3",
    referralLinkId: "link_solar_otieno",
    amount: 45000,
    commissionEarned: 3600, // 8% of 45000
    timestamp: daysAgo(2),
    status: "PAID"
  },
  {
    id: "conv_3",
    leadId: "lead_5",
    referralLinkId: "link_solar_fatuma",
    amount: 45000,
    commissionEarned: 3600,
    timestamp: daysAgo(3),
    status: "PAID"
  }
];

export const INITIAL_WALLETS: Wallet[] = [
  {
    id: "wallet_otieno",
    holderId: "agent_otieno",
    holderType: "AGENT",
    availableBalance: 12500, // KES available for M-Pesa withdrawal
    pendingBalance: 3500, // conv_1 (APPROVED but not yet processed/PAID)
    lifetimeEarnings: 45800
  },
  {
    id: "wallet_fatuma",
    holderId: "agent_fatuma",
    holderType: "AGENT",
    availableBalance: 5120,
    pendingBalance: 0,
    lifetimeEarnings: 15820
  },
  {
    id: "wallet_pesapos",
    holderId: "biz_pesapos",
    holderType: "BUSINESS",
    availableBalance: 85000,
    pendingBalance: 3500,
    lifetimeEarnings: 0
  },
  {
    id: "wallet_solar",
    holderId: "biz_solarspark",
    holderType: "BUSINESS",
    availableBalance: 32000,
    pendingBalance: 0,
    lifetimeEarnings: 0
  },
  {
    id: "wallet_platform",
    holderId: "platform",
    holderType: "PLATFORM",
    availableBalance: 1820000, // ReferraIOS aggregated revenue pool
    pendingBalance: 0,
    lifetimeEarnings: 5200000
  }
];

export const INITIAL_TRANSACTIONS: WalletTransaction[] = [
  {
    id: "tx_1",
    walletId: "wallet_otieno",
    type: "COMMISSION_CREDIT",
    amount: 3600,
    status: "SUCCESS",
    reference: "MP-TX-REQ57A9",
    description: "Referral Commission Credit - EcoSmart Solar Unit (Daniel Kosgei / SolarSpark East Africa)",
    timestamp: daysAgo(2)
  },
  {
    id: "tx_2",
    walletId: "wallet_otieno",
    type: "WITHDRAWAL",
    amount: 5000,
    status: "SUCCESS",
    reference: "QHF39AJD93", // M-Pesa transaction ID
    description: "M-Pesa Payout to Agent 254712345678",
    timestamp: daysAgo(5)
  },
  {
    id: "tx_3",
    walletId: "wallet_fatuma",
    type: "COMMISSION_CREDIT",
    amount: 3600,
    status: "SUCCESS",
    reference: "MF-TX-ECO02",
    description: "Referral Commission Credit - Daniel Kosgei (SolarSpark East Africa)",
    timestamp: daysAgo(3)
  },
  {
    id: "tx_4",
    walletId: "wallet_pesapos",
    type: "DEPOSIT",
    amount: 50000,
    status: "SUCCESS",
    reference: "RMA92DA12",
    description: "Wallet Funding via M-Pesa Till 5544332",
    timestamp: daysAgo(10)
  }
];

export const INITIAL_PAYOUTS: PayoutRequest[] = [
  {
    id: "pay_1",
    agentId: "agent_otieno",
    agentName: "Otieno Onyango",
    mpesaNumber: "254712345678",
    amount: 5000,
    status: "APPROVED",
    timestamp: daysAgo(5),
    completedAt: daysAgo(5),
    mpesaReceiptNumber: "QHF39AJD93"
  },
  {
    id: "pay_2",
    agentId: "agent_otieno",
    agentName: "Otieno Onyango",
    mpesaNumber: "254712345678",
    amount: 8000,
    status: "PENDING",
    timestamp: minutesAgo(45)
  },
  {
    id: "pay_3",
    agentId: "agent_fatuma",
    agentName: "Fatuma Ali",
    mpesaNumber: "254798765432",
    amount: 3000,
    status: "PENDING",
    timestamp: hoursAgo(6)
  }
];

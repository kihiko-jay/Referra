/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "ADMIN" | "BUSINESS_OWNER" | "AGENT";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
}

export interface Business {
  id: string;
  name: string;
  logoUrl?: string;
  industry: string;
  location: string;
  website: string;
  mpesaTillNumber?: string;
  subscriptionPlan: "STARTER" | "GROWTH" | "ENTERPRISE";
  balance: number; // For paying agent commissions
}

export interface Agent {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  joinedDate: string;
  status: "ACTIVE" | "PENDING" | "SUSPENDED";
  mpesaNumber: string;
  rating: number;
}

export interface Campaign {
  id: string;
  businessId: string;
  businessName: string;
  title: string;
  description: string;
  rewardType: "PERCENTAGE" | "FIXED";
  rewardValue: number; // e.g. 10 for 10% or 1500 for 1500 KES
  productPrice: number; // For ROI and revenue attribution
  terms: string;
  status: "ACTIVE" | "DRAFT" | "EXPIRED";
  expiryDate: string;
  clicksCount: number;
  leadsCount: number;
  conversionsCount: number;
}

export interface ReferralLink {
  id: string;
  campaignId: string;
  agentId: string;
  uniqueCode: string; // e.g., "ref-amanisoko-09"
  clicksCount: number;
  leadsCount: number;
  conversionsCount: number;
}

export interface Click {
  id: string;
  referralLinkId: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  location: string;
}

export interface Lead {
  id: string;
  referralLinkId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  timestamp: string;
  status: "PENDING" | "CONVERTED" | "DISQUALIFIED";
  notes?: string;
}

export interface Conversion {
  id: string;
  leadId: string;
  referralLinkId: string;
  amount: number; // Sale value
  commissionEarned: number; // Calculated commission
  timestamp: string;
  status: "PENDING_APPROVAL" | "APPROVED" | "PAID" | "REJECTED";
}

export interface Wallet {
  id: string;
  holderId: string; // userId or businessId
  holderType: "BUSINESS" | "AGENT" | "PLATFORM";
  availableBalance: number;
  pendingBalance: number;
  lifetimeEarnings: number;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "COMMISSION_CREDIT" | "COMMISSION_PAYOUT";
  amount: number;
  status: "SUCCESS" | "PENDING" | "FAILED";
  reference: string; // e.g. M-Pesa code QRF93MD9A
  description: string;
  timestamp: string;
}

export interface PayoutRequest {
  id: string;
  agentId: string;
  agentName: string;
  mpesaNumber: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "FAILED";
  timestamp: string;
  completedAt?: string;
  mpesaReceiptNumber?: string;
}

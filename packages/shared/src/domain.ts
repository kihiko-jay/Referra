import { z } from 'zod';

/**
 * Domain model for ReferraIOS.
 *
 * zod schemas are the single source of truth; TypeScript types are inferred
 * from them so the API (DTO validation) and the web client share one contract.
 * Migrated from the original prototype's apps/web/src/types.ts.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const UserRole = z.enum(['ADMIN', 'BUSINESS_OWNER', 'AGENT']);
export type UserRole = z.infer<typeof UserRole>;

export const SubscriptionPlan = z.enum(['STARTER', 'GROWTH', 'ENTERPRISE']);
export type SubscriptionPlan = z.infer<typeof SubscriptionPlan>;

export const AgentStatus = z.enum(['ACTIVE', 'PENDING', 'SUSPENDED']);
export type AgentStatus = z.infer<typeof AgentStatus>;

export const RewardType = z.enum(['PERCENTAGE', 'FIXED']);
export type RewardType = z.infer<typeof RewardType>;

export const CampaignStatus = z.enum(['ACTIVE', 'DRAFT', 'EXPIRED']);
export type CampaignStatus = z.infer<typeof CampaignStatus>;

export const LeadStatus = z.enum(['PENDING', 'CONVERTED', 'DISQUALIFIED']);
export type LeadStatus = z.infer<typeof LeadStatus>;

export const ConversionStatus = z.enum([
  'PENDING_APPROVAL',
  'APPROVED',
  'PAID',
  'REJECTED',
]);
export type ConversionStatus = z.infer<typeof ConversionStatus>;

export const HolderType = z.enum(['BUSINESS', 'AGENT', 'PLATFORM']);
export type HolderType = z.infer<typeof HolderType>;

export const WalletTransactionType = z.enum([
  'DEPOSIT',
  'WITHDRAWAL',
  'COMMISSION_CREDIT',
  'COMMISSION_PAYOUT',
]);
export type WalletTransactionType = z.infer<typeof WalletTransactionType>;

export const TransactionStatus = z.enum(['SUCCESS', 'PENDING', 'FAILED']);
export type TransactionStatus = z.infer<typeof TransactionStatus>;

export const PayoutStatus = z.enum(['PENDING', 'APPROVED', 'FAILED']);
export type PayoutStatus = z.infer<typeof PayoutStatus>;

// ---------------------------------------------------------------------------
// Shared field helpers
// ---------------------------------------------------------------------------

/** Kenyan MSISDN, e.g. 254712345678. */
export const Msisdn = z
  .string()
  .regex(/^254\d{9}$/, 'Must be a 254XXXXXXXXX phone number');

/** Money is stored as an integer minor unit (KES cents) on the server, but the
 * prototype used whole-KES numbers; the schema accepts non-negative integers. */
export const Money = z.number().int().nonnegative();

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: UserRole,
  avatarUrl: z.string().url().optional(),
  phone: z.string().optional(),
});
export type User = z.infer<typeof UserSchema>;

export const BusinessSchema = z.object({
  id: z.string(),
  name: z.string(),
  logoUrl: z.string().url().optional(),
  industry: z.string(),
  location: z.string(),
  website: z.string(),
  mpesaTillNumber: z.string().optional(),
  subscriptionPlan: SubscriptionPlan,
  balance: Money,
});
export type Business = z.infer<typeof BusinessSchema>;

export const AgentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  joinedDate: z.string(),
  status: AgentStatus,
  mpesaNumber: z.string(),
  rating: z.number().min(0).max(5),
});
export type Agent = z.infer<typeof AgentSchema>;

export const CampaignSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  businessName: z.string(),
  title: z.string(),
  description: z.string(),
  rewardType: RewardType,
  rewardValue: z.number().nonnegative(),
  productPrice: Money,
  terms: z.string(),
  status: CampaignStatus,
  expiryDate: z.string(),
  clicksCount: z.number().int().nonnegative(),
  leadsCount: z.number().int().nonnegative(),
  conversionsCount: z.number().int().nonnegative(),
});
export type Campaign = z.infer<typeof CampaignSchema>;

export const ReferralLinkSchema = z.object({
  id: z.string(),
  campaignId: z.string(),
  agentId: z.string(),
  uniqueCode: z.string(),
  clicksCount: z.number().int().nonnegative(),
  leadsCount: z.number().int().nonnegative(),
  conversionsCount: z.number().int().nonnegative(),
});
export type ReferralLink = z.infer<typeof ReferralLinkSchema>;

export const ClickSchema = z.object({
  id: z.string(),
  referralLinkId: z.string(),
  timestamp: z.string(),
  ipAddress: z.string(),
  userAgent: z.string(),
  location: z.string(),
});
export type Click = z.infer<typeof ClickSchema>;

export const LeadSchema = z.object({
  id: z.string(),
  referralLinkId: z.string(),
  customerName: z.string(),
  customerEmail: z.string().email(),
  customerPhone: z.string(),
  timestamp: z.string(),
  status: LeadStatus,
  notes: z.string().optional(),
});
export type Lead = z.infer<typeof LeadSchema>;

export const ConversionSchema = z.object({
  id: z.string(),
  leadId: z.string(),
  referralLinkId: z.string(),
  amount: Money,
  commissionEarned: Money,
  timestamp: z.string(),
  status: ConversionStatus,
});
export type Conversion = z.infer<typeof ConversionSchema>;

export const WalletSchema = z.object({
  id: z.string(),
  holderId: z.string(),
  holderType: HolderType,
  availableBalance: Money,
  pendingBalance: Money,
  lifetimeEarnings: Money,
});
export type Wallet = z.infer<typeof WalletSchema>;

export const WalletTransactionSchema = z.object({
  id: z.string(),
  walletId: z.string(),
  type: WalletTransactionType,
  amount: Money,
  status: TransactionStatus,
  reference: z.string(),
  description: z.string(),
  timestamp: z.string(),
});
export type WalletTransaction = z.infer<typeof WalletTransactionSchema>;

export const PayoutRequestSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  agentName: z.string(),
  mpesaNumber: z.string(),
  amount: Money,
  status: PayoutStatus,
  timestamp: z.string(),
  completedAt: z.string().optional(),
  mpesaReceiptNumber: z.string().optional(),
});
export type PayoutRequest = z.infer<typeof PayoutRequestSchema>;

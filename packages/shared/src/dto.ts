import { z } from 'zod';
import {
  AgentSchema,
  CampaignSchema,
  Money,
  Msisdn,
  RewardType,
  SubscriptionPlan,
} from './domain';

/**
 * Request/response contracts for the API. Each mirrors an action that lived in
 * the prototype's AppContext, now expressed as an explicit, validated input.
 */

// ----- Auth -----

export const RegisterDto = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['BUSINESS_OWNER', 'AGENT']),
  phone: Msisdn.optional(),
});
export type RegisterDto = z.infer<typeof RegisterDto>;

export const LoginDto = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginDto = z.infer<typeof LoginDto>;

// ----- Campaigns -----

export const CreateCampaignDto = CampaignSchema.pick({
  title: true,
  description: true,
  rewardType: true,
  rewardValue: true,
  productPrice: true,
  terms: true,
  expiryDate: true,
}).extend({
  status: z.enum(['ACTIVE', 'DRAFT']).default('DRAFT'),
});
export type CreateCampaignDto = z.infer<typeof CreateCampaignDto>;

// ----- Agents -----

export const CreateAgentDto = AgentSchema.pick({
  name: true,
  email: true,
  phone: true,
  mpesaNumber: true,
});
export type CreateAgentDto = z.infer<typeof CreateAgentDto>;

// ----- Public tracking / lead capture -----

export const PublicLeadDto = z.object({
  referralCode: z.string().min(1),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(7),
  notes: z.string().max(2000).optional(),
  captchaToken: z.string().optional(),
});
export type PublicLeadDto = z.infer<typeof PublicLeadDto>;

// ----- Conversions -----

export const ConvertLeadDto = z.object({
  leadId: z.string(),
  customAmount: Money.optional(),
});
export type ConvertLeadDto = z.infer<typeof ConvertLeadDto>;

// ----- Payouts / wallet -----

export const RequestPayoutDto = z.object({
  amount: Money.refine((v) => v > 0, 'Amount must be greater than zero'),
});
export type RequestPayoutDto = z.infer<typeof RequestPayoutDto>;

export const FundWalletDto = z.object({
  amount: Money.refine((v) => v > 0, 'Amount must be greater than zero'),
  phone: Msisdn,
});
export type FundWalletDto = z.infer<typeof FundWalletDto>;

// ----- Billing -----

export const StartCheckoutDto = z.object({
  plan: SubscriptionPlan,
});
export type StartCheckoutDto = z.infer<typeof StartCheckoutDto>;

// ----- AI -----

export const GeneratePitchDto = z.object({
  campaignId: z.string(),
  channel: z.enum(['WHATSAPP', 'SMS', 'SOCIAL', 'EMAIL']).default('WHATSAPP'),
  tone: z.enum(['FRIENDLY', 'PROFESSIONAL', 'URGENT']).default('FRIENDLY'),
});
export type GeneratePitchDto = z.infer<typeof GeneratePitchDto>;

export const OptimizeCampaignDto = z.object({
  campaignId: z.string(),
});
export type OptimizeCampaignDto = z.infer<typeof OptimizeCampaignDto>;

export const AnalyticsAskDto = z.object({
  question: z.string().min(3).max(500),
});
export type AnalyticsAskDto = z.infer<typeof AnalyticsAskDto>;

// Re-export commonly used field validators for convenience.
export { RewardType };

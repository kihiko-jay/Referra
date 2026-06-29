/**
 * Typed API client for the ReferraIOS backend. Uses cookie auth
 * (credentials: 'include'); on a 401 it transparently attempts a single token
 * refresh and retries before surfacing the error.
 */
import type {
  RegisterDto,
  LoginDto,
  CreateBusinessDto,
  CreateCampaignDto,
  PublicLeadDto,
  GeneratePitchDto,
  AnalyticsAskDto,
} from '@referraios/shared';

const BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
  }
}

async function raw<T>(
  path: string,
  init: RequestInit & { retry?: boolean } = {},
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (res.status === 401 && init.retry !== false && path !== '/auth/refresh') {
    const refreshed = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (refreshed.ok) return raw<T>(path, { ...init, retry: false });
  }

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = undefined;
    }
    const message =
      (body as { message?: string } | undefined)?.message ??
      `Request failed (${res.status})`;
    throw new ApiError(res.status, message, body);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const get = <T>(path: string) => raw<T>(path, { method: 'GET' });
const post = <T>(path: string, body?: unknown) =>
  raw<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });

// ---- Response shapes (subset of backend payloads we consume) ----
export interface Me {
  id: string;
  email: string;
  role: 'ADMIN' | 'BUSINESS_OWNER' | 'AGENT';
  agentId: string | null;
  businessIds: string[];
}
export interface BusinessView {
  id: string;
  name: string;
  industry: string;
  location: string;
  subscriptionPlan: string;
  availableBalance: number;
}
export interface CampaignView {
  id: string;
  title: string;
  description: string;
  rewardType: 'PERCENTAGE' | 'FIXED';
  rewardValue: number;
  productPriceCents: number;
  status: string;
  expiryDate: string;
}
export interface LeadView {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: string;
  fraudScore: number | null;
  fraudFlags: string[];
  createdAt: string;
  conversion: { id: string; status: string } | null;
  referralLink: {
    campaign: { title: string };
    agent?: { user: { name: string } };
  };
}
export interface ConversionView {
  id: string;
  amountCents: number;
  commissionCents: number;
  status: string;
  createdAt: string;
  lead: { customerName: string };
  referralLink: {
    agent: { user: { name: string } };
    campaign: { title: string };
  };
}
export interface LinkView {
  id: string;
  uniqueCode: string;
  campaign: CampaignView;
  _count: { clicks: number; leads: number; conversions: number };
}
export interface AgentWallet {
  availableBalance: number;
  pendingApproval: number;
  payoutPending: number;
  lifetimeEarnings: number;
}
export interface AgentProfile {
  id: string;
  status: string;
  rating: number;
  mpesaNumber: string;
  user: { name: string; email: string };
  wallet: AgentWallet;
}
export interface AgentRow {
  id: string;
  status: string;
  rating: number;
  mpesaNumber: string;
  user: { name: string; email: string };
}
export interface PayoutRow {
  id: string;
  amountCents: number;
  status: string;
  mpesaNumber: string;
  mpesaReceiptNumber: string | null;
  createdAt: string;
  agent?: { user: { name: string } };
}

export const api = {
  auth: {
    me: () => get<Me>('/auth/me'),
    login: (dto: LoginDto) => post<Me>('/auth/login', dto),
    register: (dto: RegisterDto) => post<{ userId: string }>('/auth/register', dto),
    logout: () => post<{ ok: boolean }>('/auth/logout'),
  },
  businesses: {
    list: () => get<BusinessView[]>('/businesses'),
    create: (dto: CreateBusinessDto) => post<BusinessView>('/businesses', dto),
  },
  campaigns: {
    forBusiness: (bizId: string) =>
      get<CampaignView[]>(`/businesses/${bizId}/campaigns`),
    create: (bizId: string, dto: CreateCampaignDto) =>
      post<CampaignView>(`/businesses/${bizId}/campaigns`, dto),
    promotable: () => get<(CampaignView & { business: { name: string } })[]>(
      '/campaigns/promotable',
    ),
    publicByCode: (code: string) =>
      get<{
        referralCode: string;
        campaign: {
          title: string;
          description: string;
          terms: string;
          productPrice: number;
          businessName: string;
          status: string;
        };
      }>(`/public/campaigns/${encodeURIComponent(code)}`),
  },
  leads: {
    forBusiness: () => get<LeadView[]>('/business/leads'),
    forAgent: () => get<LeadView[]>('/agent/leads'),
    public: (dto: PublicLeadDto) =>
      post<{ id: string; deduped: boolean }>('/public/leads', dto),
  },
  conversions: {
    forBusiness: () => get<ConversionView[]>('/business/conversions'),
    convert: (leadId: string, customAmount?: number) =>
      post('/conversions/convert', { leadId, customAmount }),
    approve: (id: string) => post(`/conversions/${id}/approve`),
    reject: (id: string) => post(`/conversions/${id}/reject`),
  },
  links: {
    mine: () => get<LinkView[]>('/agent/links'),
    create: (campaignId: string) => post<LinkView>('/agent/links', { campaignId }),
  },
  agents: {
    me: () => get<AgentProfile>('/agents/me'),
    list: () => get<AgentRow[]>('/agents'),
    approve: (id: string) => post(`/agents/${id}/approve`),
    suspend: (id: string) => post(`/agents/${id}/suspend`),
  },
  wallet: {
    agent: () => get<AgentWallet>('/wallet/agent'),
    business: (id: string) => get<{ availableBalance: number }>(`/wallet/business/${id}`),
  },
  payouts: {
    request: (amount: number) => post('/payouts', { amount }),
    mine: () => get<PayoutRow[]>('/payouts/mine'),
    all: () => get<PayoutRow[]>('/payouts'),
    process: (id: string, approve: boolean) =>
      post(`/payouts/${id}/process`, { approve }),
  },
  payments: {
    deposit: (bizId: string, amount: number, phone: string) =>
      post(`/payments/businesses/${bizId}/deposit`, { amount, phone }),
  },
  ai: {
    pitch: (dto: GeneratePitchDto) =>
      post<{ content: string; channel: string; tone: string }>('/ai/pitch', dto),
    optimize: (campaignId: string) =>
      post<{
        suggestedRewardType: string;
        suggestedRewardValue: number;
        rationale: string;
        predictedConversionRate: number;
        targetSegments: string[];
      }>('/ai/campaigns/optimize', { campaignId }),
    ask: (dto: AnalyticsAskDto) =>
      post<{ answer: string; metrics: unknown }>('/ai/analytics/ask', dto),
    scoreLead: (id: string) =>
      post<{ score: number; flags: string[]; riskLevel: string; narrative?: string }>(
        `/ai/leads/${id}/score`,
      ),
  },
};

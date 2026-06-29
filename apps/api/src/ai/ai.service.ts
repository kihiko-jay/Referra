import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AiFeature } from '@prisma/client';
import { z } from 'zod';
import type {
  GeneratePitchDto,
  OptimizeCampaignDto,
  AnalyticsAskDto,
} from '@referraios/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AnthropicProvider, type AiUsage } from './anthropic.provider';
import { computeFraudSignals, type FraudResult } from './fraud';
import { toKes } from '../common/money';
import type { AuthUser } from '../auth/auth.types';

const OptimizationSchema = z.object({
  suggestedRewardType: z.enum(['PERCENTAGE', 'FIXED']),
  suggestedRewardValue: z.number(),
  rationale: z.string(),
  predictedConversionRate: z.number(),
  targetSegments: z.array(z.string()),
});
type Optimization = z.infer<typeof OptimizationSchema>;

// JSON Schema mirror of OptimizationSchema for the model's output_config.format.
const OPTIMIZATION_JSON_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  properties: {
    suggestedRewardType: { type: 'string', enum: ['PERCENTAGE', 'FIXED'] },
    suggestedRewardValue: { type: 'number' },
    rationale: { type: 'string' },
    predictedConversionRate: { type: 'number' },
    targetSegments: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'suggestedRewardType',
    'suggestedRewardValue',
    'rationale',
    'predictedConversionRate',
    'targetSegments',
  ],
};

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AnthropicProvider,
  ) {}

  get isConfigured(): boolean {
    return this.ai.isConfigured;
  }

  // --- Agent copilot & content ---
  async generatePitch(agentId: string, dto: GeneratePitchDto) {
    const link = await this.prisma.referralLink.findFirst({
      where: { agentId, campaignId: dto.campaignId },
      include: { campaign: { include: { business: true } } },
    });
    if (!link) {
      throw new NotFoundException('No referral link for this agent + campaign');
    }
    const c = link.campaign;
    const reward =
      c.rewardType === 'FIXED'
        ? `KES ${c.rewardValue} per sale`
        : `${c.rewardValue}% of each sale`;

    const system =
      'You are a top-performing sales copywriter for a Kenyan referral marketing platform. ' +
      'Write concise, persuasive, culturally relevant copy. Never invent prices or terms.';
    const prompt =
      `Write a ${dto.tone.toLowerCase()} ${dto.channel} message a sales agent can send to ` +
      `prospects to promote this offer. Include the referral link placeholder {{LINK}}.\n\n` +
      `Business: ${c.business.name}\nCampaign: ${c.title}\nDescription: ${c.description}\n` +
      `Reward to the agent: ${reward}\nProduct price: KES ${toKes(c.productPriceCents)}\n` +
      `Terms: ${c.terms}`;

    const { text, usage } = await this.ai.complete({
      model: this.ai.fast,
      system,
      prompt,
      maxTokens: 600,
    });
    await this.log('PITCH', this.ai.fast, usage, {
      businessId: c.businessId,
      request: dto,
    });
    return { content: text, channel: dto.channel, tone: dto.tone };
  }

  // --- Lead scoring & fraud (deterministic gate + optional AI narrative) ---
  async scoreLead(leadId: string): Promise<FraudResult & { narrative?: string }> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        referralLink: { include: { agent: { include: { user: true } } } },
      },
    });
    if (!lead) throw new NotFoundException('Lead not found');

    const [duplicatePhoneCount, sameIpClickCount] = await Promise.all([
      this.prisma.lead.count({
        where: { customerPhone: lead.customerPhone, id: { not: lead.id } },
      }),
      this.prisma.click.count({
        where: {
          referralLinkId: lead.referralLinkId,
          createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
        },
      }),
    ]);

    const result = computeFraudSignals({
      agentPhone: lead.referralLink.agent.mpesaNumber,
      agentEmail: lead.referralLink.agent.user.email,
      leadPhone: lead.customerPhone,
      leadEmail: lead.customerEmail,
      duplicatePhoneCount,
      sameIpClickCount,
    });

    await this.prisma.lead.update({
      where: { id: lead.id },
      data: { fraudScore: result.score, fraudFlags: result.flags },
    });

    // Optional AI narrative — never changes the deterministic gate.
    let narrative: string | undefined;
    if (this.ai.isConfigured && result.flags.length > 0) {
      const { text, usage } = await this.ai.complete({
        model: this.ai.fast,
        system:
          'You are a fraud analyst. In 1-2 sentences, explain the risk to a reviewer. Be factual.',
        prompt: `Lead risk ${result.riskLevel} (score ${result.score}). Signals: ${result.flags.join(', ')}.`,
        maxTokens: 150,
      });
      narrative = text;
      await this.log('LEAD_SCORE', this.ai.fast, usage, {
        businessId: undefined,
        request: { leadId },
      });
    }
    return { ...result, narrative };
  }

  // --- Campaign optimization ---
  async optimizeCampaign(dto: OptimizeCampaignDto, ownerBusinessIds: string[]) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: dto.campaignId },
      include: {
        referralLinks: {
          include: {
            _count: { select: { clicks: true, leads: true, conversions: true } },
          },
        },
      },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (!ownerBusinessIds.includes(campaign.businessId)) {
      throw new ForbiddenException('Not your campaign');
    }

    const totals = campaign.referralLinks.reduce(
      (acc, l) => ({
        clicks: acc.clicks + l._count.clicks,
        leads: acc.leads + l._count.leads,
        conversions: acc.conversions + l._count.conversions,
      }),
      { clicks: 0, leads: 0, conversions: 0 },
    );

    const system =
      'You are a growth strategist for referral campaigns in Kenya. Recommend reward ' +
      'structures that maximize ROI. Base every number on the data provided.';
    const prompt =
      `Optimize this campaign. Current: rewardType=${campaign.rewardType}, ` +
      `rewardValue=${campaign.rewardValue}, productPrice=KES ${toKes(campaign.productPriceCents)}. ` +
      `Funnel: ${totals.clicks} clicks, ${totals.leads} leads, ${totals.conversions} conversions ` +
      `across ${campaign.referralLinks.length} agents.`;

    const { data, usage } = await this.ai.completeJSON<Optimization>({
      model: this.ai.smart,
      system,
      prompt,
      jsonSchema: OPTIMIZATION_JSON_SCHEMA,
      parse: (v) => OptimizationSchema.parse(v),
      maxTokens: 1024,
      effort: 'high',
    });
    await this.log('CAMPAIGN_OPTIMIZE', this.ai.smart, usage, {
      businessId: campaign.businessId,
      request: dto,
      response: data,
    });
    return data;
  }

  // --- NL analytics copilot (over safe precomputed aggregates only) ---
  async askAnalytics(dto: AnalyticsAskDto, user: AuthUser) {
    const snapshot = await this.analyticsSnapshot(user);
    const system =
      'You are an analytics copilot. Answer ONLY from the JSON metrics provided. ' +
      'If the data cannot answer the question, say so. Never fabricate numbers.';
    const prompt = `Metrics:\n${JSON.stringify(snapshot)}\n\nQuestion: ${dto.question}`;
    const { text, usage } = await this.ai.complete({
      model: this.ai.fast,
      system,
      prompt,
      maxTokens: 700,
    });
    await this.log('ANALYTICS_ASK', this.ai.fast, usage, {
      userId: user.id,
      businessId: user.businessIds[0],
      request: dto,
    });
    return { answer: text, metrics: snapshot };
  }

  /** Tenant-scoped, read-only aggregate snapshot — the only data the analytics
   * copilot ever sees (the model never issues queries itself). */
  private async analyticsSnapshot(user: AuthUser) {
    if (user.role === 'AGENT' && user.agentId) {
      const [clicks, leads, conversions] = await Promise.all([
        this.prisma.click.count({
          where: { referralLink: { agentId: user.agentId } },
        }),
        this.prisma.lead.count({
          where: { referralLink: { agentId: user.agentId } },
        }),
        this.prisma.conversion.count({
          where: { referralLink: { agentId: user.agentId } },
        }),
      ]);
      return { scope: 'AGENT', clicks, leads, conversions };
    }
    const where = { campaign: { businessId: { in: user.businessIds } } };
    const [clicks, leads, conversions, paid] = await Promise.all([
      this.prisma.click.count({ where: { referralLink: where } }),
      this.prisma.lead.count({ where: { referralLink: where } }),
      this.prisma.conversion.count({ where: { referralLink: where } }),
      this.prisma.conversion.aggregate({
        _sum: { commissionCents: true },
        where: { status: 'PAID', referralLink: where },
      }),
    ]);
    return {
      scope: 'BUSINESS',
      clicks,
      leads,
      conversions,
      commissionPaidKes: toKes(paid._sum.commissionCents ?? 0),
    };
  }

  private async log(
    feature: AiFeature,
    model: string,
    usage: AiUsage,
    extra: {
      userId?: string;
      businessId?: string;
      request?: unknown;
      response?: unknown;
    },
  ): Promise<void> {
    await this.prisma.aiInteraction.create({
      data: {
        feature,
        provider: 'anthropic',
        model,
        userId: extra.userId,
        businessId: extra.businessId,
        promptTokens: usage.inputTokens,
        completionTokens: usage.outputTokens,
        costCents: usage.costCents,
        request: (extra.request ?? null) as object,
        response: (extra.response ?? null) as object,
      },
    });
  }
}

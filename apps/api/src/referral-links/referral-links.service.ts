import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { buildReferralCode } from './code';

@Injectable()
export class ReferralLinksService {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns the agent's link for a campaign, creating it on first request. */
  async getOrCreate(campaignId: string, agentId: string) {
    const existing = await this.prisma.referralLink.findUnique({
      where: { campaignId_agentId: { campaignId, agentId } },
    });
    if (existing) return existing;

    const [campaign, agent] = await Promise.all([
      this.prisma.campaign.findUnique({ where: { id: campaignId } }),
      this.prisma.agent.findUnique({
        where: { id: agentId },
        include: { user: true },
      }),
    ]);
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (!agent) throw new NotFoundException('Agent not found');

    return this.prisma.referralLink.create({
      data: {
        campaignId,
        agentId,
        uniqueCode: buildReferralCode(agent.user.name, campaign.title),
      },
    });
  }

  /** Bulk-provisions links for many agents on a new campaign (used by
   * CampaignsService.create), within an existing transaction. */
  async createManyForCampaign(
    tx: Prisma.TransactionClient,
    campaignTitle: string,
    campaignId: string,
    agents: { id: string; name: string }[],
  ): Promise<void> {
    if (agents.length === 0) return;
    await tx.referralLink.createMany({
      data: agents.map((a) => ({
        campaignId,
        agentId: a.id,
        uniqueCode: buildReferralCode(a.name, campaignTitle),
      })),
      skipDuplicates: true,
    });
  }

  async listForAgent(agentId: string) {
    return this.prisma.referralLink.findMany({
      where: { agentId },
      include: { campaign: true, _count: { select: { clicks: true, leads: true, conversions: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}

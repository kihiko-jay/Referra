import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreateCampaignDto } from '@referraios/shared';
import { PrismaService } from '../prisma/prisma.service';
import { ReferralLinksService } from '../referral-links/referral-links.service';
import { toCents } from '../common/money';

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly links: ReferralLinksService,
  ) {}

  /**
   * Creates a campaign and auto-generates referral links for all active agents,
   * mirroring the prototype's addNewCampaign behavior.
   */
  async create(
    businessId: string,
    ownerBusinessIds: string[],
    dto: CreateCampaignDto,
  ) {
    if (!ownerBusinessIds.includes(businessId)) {
      throw new ForbiddenException('Not your business');
    }
    return this.prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.create({
        data: {
          businessId,
          title: dto.title,
          description: dto.description,
          rewardType: dto.rewardType,
          rewardValue: dto.rewardValue,
          productPriceCents: toCents(dto.productPrice),
          terms: dto.terms,
          status: dto.status,
          expiryDate: new Date(dto.expiryDate),
        },
      });

      const activeAgents = await tx.agent.findMany({
        where: { status: 'ACTIVE' },
        include: { user: { select: { name: true } } },
      });
      await this.links.createManyForCampaign(
        tx,
        campaign.title,
        campaign.id,
        activeAgents.map((a) => ({ id: a.id, name: a.user.name })),
      );

      return campaign;
    });
  }

  async listForBusiness(businessId: string, ownerBusinessIds: string[]) {
    if (!ownerBusinessIds.includes(businessId)) {
      throw new ForbiddenException('Not your business');
    }
    return this.prisma.campaign.findMany({
      where: { businessId },
      include: {
        _count: { select: { referralLinks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Public-facing campaign view used by the referral landing page. */
  async getPublicByCode(code: string) {
    const link = await this.prisma.referralLink.findUnique({
      where: { uniqueCode: code },
      include: { campaign: { include: { business: true } } },
    });
    if (!link) throw new NotFoundException('Referral link not found');
    const c = link.campaign;
    return {
      referralCode: code,
      campaign: {
        title: c.title,
        description: c.description,
        terms: c.terms,
        productPrice: c.productPriceCents / 100,
        businessName: c.business.name,
        status: c.status,
      },
    };
  }

  /** Active campaigns an agent can promote. */
  async listPromotable() {
    return this.prisma.campaign.findMany({
      where: { status: 'ACTIVE' },
      include: { business: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}

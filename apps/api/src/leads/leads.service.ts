import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Leads across all campaigns owned by the given businesses. */
  async listForBusinesses(businessIds: string[]) {
    return this.prisma.lead.findMany({
      where: {
        referralLink: { campaign: { businessId: { in: businessIds } } },
      },
      include: {
        conversion: true,
        referralLink: {
          include: {
            agent: { include: { user: { select: { name: true } } } },
            campaign: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Leads an agent has generated across their links. */
  async listForAgent(agentId: string) {
    return this.prisma.lead.findMany({
      where: { referralLink: { agentId } },
      include: {
        conversion: true,
        referralLink: { include: { campaign: { select: { title: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import type { AgentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class AgentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
  ) {}

  async list() {
    return this.prisma.agent.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async setStatus(agentId: string, status: AgentStatus) {
    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) throw new NotFoundException('Agent not found');
    return this.prisma.agent.update({
      where: { id: agentId },
      data: { status },
    });
  }

  async profile(agentId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      include: { user: { select: { name: true, email: true } } },
    });
    if (!agent) throw new NotFoundException('Agent not found');
    return {
      ...agent,
      wallet: await this.wallet.agentSummary(agentId),
    };
  }
}

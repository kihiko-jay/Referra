import { Injectable, NotFoundException } from '@nestjs/common';
import type { PublicLeadDto } from '@referraios/shared';
import { PrismaService } from '../prisma/prisma.service';

export interface ClickContext {
  ipAddress: string;
  userAgent: string;
  referrer?: string;
  location?: string;
}

/**
 * Real referral tracking (replaces the prototype's simulated trackClick /
 * recordLead). Clicks and leads are attributed to a referral link by its public
 * code; counts are derived from these rows rather than denormalized counters.
 */
@Injectable()
export class TrackingService {
  constructor(private readonly prisma: PrismaService) {}

  private async linkByCode(code: string) {
    const link = await this.prisma.referralLink.findUnique({
      where: { uniqueCode: code },
    });
    if (!link) throw new NotFoundException('Referral link not found');
    return link;
  }

  async recordClick(code: string, ctx: ClickContext): Promise<void> {
    const link = await this.linkByCode(code);
    await this.prisma.click.create({
      data: {
        referralLinkId: link.id,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        referrer: ctx.referrer,
        location: ctx.location ?? 'Unknown',
      },
    });
  }

  /**
   * Captures a lead from the public landing page. Idempotent within a short
   * window: a repeat submission of the same email on the same link returns the
   * existing pending lead instead of creating a duplicate.
   */
  async captureLead(dto: PublicLeadDto, ctx: ClickContext) {
    const link = await this.linkByCode(dto.referralCode);

    const recent = await this.prisma.lead.findFirst({
      where: {
        referralLinkId: link.id,
        customerEmail: dto.customerEmail,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });
    if (recent) return { id: recent.id, deduped: true };

    // A landing-page submission implies a click; record both for accurate
    // click->lead funnel stats.
    await this.prisma.click.create({
      data: {
        referralLinkId: link.id,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        referrer: ctx.referrer,
        location: ctx.location ?? 'Unknown',
      },
    });

    const lead = await this.prisma.lead.create({
      data: {
        referralLinkId: link.id,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        notes: dto.notes,
        status: 'PENDING',
      },
    });
    return { id: lead.id, deduped: false };
  }
}

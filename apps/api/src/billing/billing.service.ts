import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { SubscriptionPlan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from './stripe.service';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
  ) {}

  async startCheckout(
    businessId: string,
    ownerBusinessIds: string[],
    plan: SubscriptionPlan,
  ) {
    if (!ownerBusinessIds.includes(businessId)) {
      throw new ForbiddenException('Not your business');
    }
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: { owner: { select: { email: true } } },
    });
    if (!business) throw new NotFoundException('Business not found');

    return this.stripe.createCheckoutSession({
      businessId,
      plan,
      customerEmail: business.owner.email,
    });
  }

  /** Upserts a subscription after a completed Checkout (called from webhook). */
  async onCheckoutCompleted(params: {
    businessId: string;
    plan: SubscriptionPlan;
    customerId?: string;
    subscriptionId?: string;
  }): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.subscription.upsert({
        where: { businessId: params.businessId },
        create: {
          businessId: params.businessId,
          plan: params.plan,
          status: 'ACTIVE',
          provider: 'STRIPE',
          providerCustomerId: params.customerId,
          providerSubscriptionId: params.subscriptionId,
        },
        update: {
          plan: params.plan,
          status: 'ACTIVE',
          providerCustomerId: params.customerId,
          providerSubscriptionId: params.subscriptionId,
        },
      }),
      this.prisma.business.update({
        where: { id: params.businessId },
        data: { subscriptionPlan: params.plan },
      }),
    ]);
  }

  /** Reflects subscription lifecycle changes (updated/canceled) from webhook. */
  async onSubscriptionChanged(params: {
    subscriptionId: string;
    status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
    currentPeriodEnd?: Date;
  }): Promise<void> {
    await this.prisma.subscription.updateMany({
      where: { providerSubscriptionId: params.subscriptionId },
      data: {
        status: params.status,
        currentPeriodEnd: params.currentPeriodEnd,
      },
    });
  }
}

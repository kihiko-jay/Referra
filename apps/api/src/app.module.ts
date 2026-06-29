import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './config/env';
import { PrismaModule } from './prisma/prisma.module';
import { LedgerModule } from './ledger/ledger.module';
import { ConversionsModule } from './conversions/conversions.module';
import { PayoutsModule } from './payouts/payouts.module';
import { WalletModule } from './wallet/wallet.module';
import { BusinessesModule } from './businesses/businesses.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { ReferralLinksModule } from './referral-links/referral-links.module';
import { AgentsModule } from './agents/agents.module';
import { LeadsModule } from './leads/leads.module';
import { TrackingModule } from './tracking/tracking.module';
import { PaymentsModule } from './payments/payments.module';
import { BillingModule } from './billing/billing.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    LedgerModule,
    ConversionsModule,
    PayoutsModule,
    WalletModule,
    BusinessesModule,
    CampaignsModule,
    ReferralLinksModule,
    AgentsModule,
    LeadsModule,
    TrackingModule,
    PaymentsModule,
    BillingModule,
    WebhooksModule,
    AuthModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}

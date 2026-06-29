import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';

@Module({
  controllers: [BillingController],
  providers: [StripeService, BillingService],
  exports: [StripeService, BillingService],
})
export class BillingModule {}

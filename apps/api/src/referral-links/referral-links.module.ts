import { Module } from '@nestjs/common';
import { ReferralLinksService } from './referral-links.service';
import { ReferralLinksController } from './referral-links.controller';

@Module({
  controllers: [ReferralLinksController],
  providers: [ReferralLinksService],
  exports: [ReferralLinksService],
})
export class ReferralLinksModule {}

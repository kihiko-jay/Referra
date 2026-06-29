import { Module } from '@nestjs/common';
import { ReferralLinksModule } from '../referral-links/referral-links.module';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';

@Module({
  imports: [ReferralLinksModule],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}

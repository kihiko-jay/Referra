import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateCampaignDto } from '@referraios/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { CampaignsService } from './campaigns.service';

@Controller()
export class CampaignsController {
  constructor(private readonly campaigns: CampaignsService) {}

  @Roles('BUSINESS_OWNER')
  @Post('businesses/:businessId/campaigns')
  create(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
    @Body(new ZodValidationPipe(CreateCampaignDto)) dto: CreateCampaignDto,
  ) {
    return this.campaigns.create(businessId, user.businessIds, dto);
  }

  @Roles('BUSINESS_OWNER')
  @Get('businesses/:businessId/campaigns')
  listForBusiness(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
  ) {
    return this.campaigns.listForBusiness(businessId, user.businessIds);
  }

  @Roles('AGENT')
  @Get('campaigns/promotable')
  promotable() {
    return this.campaigns.listPromotable();
  }

  @Public()
  @Get('public/campaigns/:code')
  publicByCode(@Param('code') code: string) {
    return this.campaigns.getPublicByCode(code);
  }
}

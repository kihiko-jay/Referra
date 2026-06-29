import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common';
import { CreateLinkDto } from '@referraios/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { ReferralLinksService } from './referral-links.service';

@Roles('AGENT')
@Controller('agent/links')
export class ReferralLinksController {
  constructor(private readonly links: ReferralLinksService) {}

  @Get()
  mine(@CurrentUser() user: AuthUser) {
    if (!user.agentId) throw new BadRequestException('Not an agent');
    return this.links.listForAgent(user.agentId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateLinkDto)) dto: CreateLinkDto,
  ) {
    if (!user.agentId) throw new BadRequestException('Not an agent');
    return this.links.getOrCreate(dto.campaignId, user.agentId);
  }
}

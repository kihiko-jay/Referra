import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  AnalyticsAskDto,
  GeneratePitchDto,
  OptimizeCampaignDto,
} from '@referraios/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { AiService } from './ai.service';

// AI endpoints are rate-limited more tightly than the default (cost control).
@Throttle({ default: { ttl: 60_000, limit: 20 } })
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Roles('AGENT')
  @Post('pitch')
  pitch(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(GeneratePitchDto)) dto: GeneratePitchDto,
  ) {
    if (!user.agentId) throw new BadRequestException('Not an agent');
    return this.ai.generatePitch(user.agentId, dto);
  }

  @Roles('ADMIN', 'BUSINESS_OWNER')
  @Post('leads/:id/score')
  score(@Param('id') id: string) {
    return this.ai.scoreLead(id);
  }

  @Roles('BUSINESS_OWNER')
  @Post('campaigns/optimize')
  optimize(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(OptimizeCampaignDto)) dto: OptimizeCampaignDto,
  ) {
    return this.ai.optimizeCampaign(dto, user.businessIds);
  }

  @Roles('ADMIN', 'BUSINESS_OWNER', 'AGENT')
  @Post('analytics/ask')
  ask(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(AnalyticsAskDto)) dto: AnalyticsAskDto,
  ) {
    return this.ai.askAnalytics(dto, user);
  }
}

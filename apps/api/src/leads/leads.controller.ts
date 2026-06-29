import { BadRequestException, Controller, Get } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { LeadsService } from './leads.service';

@Controller()
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Roles('BUSINESS_OWNER')
  @Get('business/leads')
  forBusiness(@CurrentUser() user: AuthUser) {
    return this.leads.listForBusinesses(user.businessIds);
  }

  @Roles('AGENT')
  @Get('agent/leads')
  forAgent(@CurrentUser() user: AuthUser) {
    if (!user.agentId) throw new BadRequestException('Not an agent');
    return this.leads.listForAgent(user.agentId);
  }
}

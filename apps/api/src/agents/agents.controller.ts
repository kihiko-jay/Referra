import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { AgentsService } from './agents.service';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agents: AgentsService) {}

  @Roles('ADMIN')
  @Get()
  list() {
    return this.agents.list();
  }

  @Roles('ADMIN')
  @Post(':id/approve')
  approve(@Param('id') id: string) {
    return this.agents.setStatus(id, 'ACTIVE');
  }

  @Roles('ADMIN')
  @Post(':id/suspend')
  suspend(@Param('id') id: string) {
    return this.agents.setStatus(id, 'SUSPENDED');
  }

  @Roles('AGENT')
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    if (!user.agentId) throw new BadRequestException('Not an agent');
    return this.agents.profile(user.agentId);
  }
}

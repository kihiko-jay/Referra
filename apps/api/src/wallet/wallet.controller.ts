import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Param,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Roles('AGENT')
  @Get('agent')
  agent(@CurrentUser() user: AuthUser) {
    if (!user.agentId) throw new BadRequestException('Not an agent');
    return this.wallet.agentSummary(user.agentId);
  }

  @Roles('BUSINESS_OWNER')
  @Get('business/:id')
  async business(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    if (!user.businessIds.includes(id)) {
      throw new ForbiddenException('Not your business');
    }
    return { availableBalance: await this.wallet.businessAvailable(id) };
  }
}

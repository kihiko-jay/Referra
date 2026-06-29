import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ConvertLeadDto } from '@referraios/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { toCents } from '../common/money';
import { ConversionsService } from './conversions.service';

@Roles('BUSINESS_OWNER')
@Controller()
export class ConversionsController {
  constructor(private readonly conversions: ConversionsService) {}

  @Get('business/conversions')
  list(@CurrentUser() user: AuthUser) {
    return this.conversions.listForBusinesses(user.businessIds);
  }

  @Post('conversions/convert')
  convert(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(ConvertLeadDto)) dto: ConvertLeadDto,
  ) {
    return this.conversions.convertLead(
      dto.leadId,
      dto.customAmount !== undefined ? toCents(dto.customAmount) : undefined,
      user.businessIds,
    );
  }

  @Post('conversions/:id/approve')
  approve(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.conversions.approveConversion(id, user.businessIds);
  }

  @Post('conversions/:id/reject')
  reject(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.conversions.rejectConversion(id, user.businessIds);
  }
}

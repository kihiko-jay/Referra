import { Body, Controller, Param, Post } from '@nestjs/common';
import { FundWalletDto } from '@referraios/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { toCents } from '../common/money';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Roles('BUSINESS_OWNER')
  @Post('businesses/:businessId/deposit')
  deposit(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
    @Body(new ZodValidationPipe(FundWalletDto)) dto: FundWalletDto,
  ) {
    return this.payments.depositViaMpesa(
      businessId,
      user.businessIds,
      toCents(dto.amount),
      dto.phone,
    );
  }

  @Roles('ADMIN')
  @Post('payouts/:id/disburse')
  disburse(@Param('id') id: string) {
    return this.payments.disburseForPayout(id);
  }
}

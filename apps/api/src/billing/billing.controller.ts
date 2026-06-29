import { Body, Controller, Param, Post } from '@nestjs/common';
import { StartCheckoutDto } from '@referraios/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { BillingService } from './billing.service';

@Roles('BUSINESS_OWNER')
@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Post(':businessId/checkout')
  checkout(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
    @Body(new ZodValidationPipe(StartCheckoutDto)) dto: StartCheckoutDto,
  ) {
    return this.billing.startCheckout(businessId, user.businessIds, dto.plan);
  }
}

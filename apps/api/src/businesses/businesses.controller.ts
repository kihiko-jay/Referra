import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateBusinessDto } from '@referraios/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { BusinessesService } from './businesses.service';

@Roles('BUSINESS_OWNER')
@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businesses: BusinessesService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateBusinessDto)) dto: CreateBusinessDto,
  ) {
    return this.businesses.create(user.id, dto);
  }

  @Get()
  mine(@CurrentUser() user: AuthUser) {
    return this.businesses.listForOwner(user.id);
  }

  @Get(':id')
  one(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.businesses.getOwned(id, user.businessIds);
  }
}

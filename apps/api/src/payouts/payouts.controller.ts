import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { ProcessPayoutDto, RequestPayoutDto } from '@referraios/shared';
import { PrismaService } from '../prisma/prisma.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { toCents } from '../common/money';
import { PayoutsService } from './payouts.service';

@Controller('payouts')
export class PayoutsController {
  constructor(
    private readonly payouts: PayoutsService,
    private readonly prisma: PrismaService,
  ) {}

  @Roles('AGENT')
  @Post()
  request(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(RequestPayoutDto)) dto: RequestPayoutDto,
  ) {
    if (!user.agentId) throw new BadRequestException('Not an agent');
    return this.payouts.requestPayout(user.agentId, toCents(dto.amount));
  }

  @Roles('AGENT')
  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    if (!user.agentId) throw new BadRequestException('Not an agent');
    return this.prisma.payoutRequest.findMany({
      where: { agentId: user.agentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Roles('ADMIN')
  @Get()
  all() {
    return this.prisma.payoutRequest.findMany({
      include: { agent: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Roles('ADMIN')
  @Post(':id/process')
  process(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ProcessPayoutDto)) dto: ProcessPayoutDto,
  ) {
    return this.payouts.processPayout(id, dto.approve, {
      mpesaReceiptNumber: dto.mpesaReceiptNumber,
    });
  }
}

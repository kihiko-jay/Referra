import {
  Body,
  Controller,
  ForbiddenException,
  Headers,
  Post,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../auth/public.decorator';
import { FlutterwaveService } from '../payments/flutterwave/flutterwave.service';
import { verifyStripeSignature } from '../billing/stripe-signature';
import { WebhooksService } from './webhooks.service';
import type { Env } from '../config/env';

const MPESA_ACK = { ResultCode: 0, ResultDesc: 'Accepted' };

@Public()
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly webhooks: WebhooksService,
    private readonly flw: FlutterwaveService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Post('mpesa/stk')
  async mpesaStk(@Body() body: unknown) {
    await this.webhooks.handleMpesaStk(body);
    return MPESA_ACK;
  }

  @Post('mpesa/b2c/result')
  async mpesaB2cResult(@Body() body: unknown) {
    await this.webhooks.handleMpesaB2cResult(body);
    return MPESA_ACK;
  }

  @Post('mpesa/b2c/timeout')
  mpesaB2cTimeout() {
    return MPESA_ACK;
  }

  @Post('flutterwave')
  async flutterwave(
    @Headers('verif-hash') signature: string | undefined,
    @Body() body: unknown,
  ) {
    if (!this.flw.verifyWebhook(signature)) {
      throw new ForbiddenException('Invalid Flutterwave signature');
    }
    await this.webhooks.handleFlutterwave(body);
    return { status: 'ok' };
  }

  @Post('stripe')
  async stripe(
    @Headers('stripe-signature') signature: string | undefined,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const secret = this.config.get('STRIPE_WEBHOOK_SECRET', { infer: true });
    const raw = req.rawBody?.toString('utf8') ?? '';
    if (
      !secret ||
      !verifyStripeSignature({ rawBody: raw, signatureHeader: signature, secret })
    ) {
      throw new ForbiddenException('Invalid Stripe signature');
    }
    await this.webhooks.handleStripe(JSON.parse(raw));
    return { received: true };
  }
}

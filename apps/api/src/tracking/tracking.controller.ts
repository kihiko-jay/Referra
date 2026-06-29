import { Body, Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { PublicLeadDto } from '@referraios/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { Public } from '../auth/public.decorator';
import { TrackingService, type ClickContext } from './tracking.service';
import type { Env } from '../config/env';

function clickContext(req: Request): ClickContext {
  const fwd = req.headers['x-forwarded-for'];
  const ip =
    (Array.isArray(fwd) ? fwd[0] : fwd?.split(',')[0]?.trim()) ||
    req.socket.remoteAddress ||
    'unknown';
  const country = req.headers['cf-ipcountry'];
  return {
    ipAddress: ip,
    userAgent: req.headers['user-agent'] ?? 'unknown',
    referrer: req.headers['referer'],
    location: typeof country === 'string' ? country : undefined,
  };
}

@Public()
@Controller()
export class TrackingController {
  constructor(
    private readonly tracking: TrackingService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /** Public redirector: records the click, sets an attribution cookie, and
   * forwards the visitor to the web landing page for this referral code. */
  @Get('r/:code')
  async redirect(
    @Param('code') code: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      await this.tracking.recordClick(code, clickContext(req));
    } catch {
      // Never block the redirect on tracking failures.
    }
    const web = this.config.get('WEB_PUBLIC_URL', { infer: true });
    res.cookie('ref_code', code, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });
    return res.redirect(302, `${web}/refer/${encodeURIComponent(code)}`);
  }

  /** Public lead capture from the referral landing page. */
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('public/leads')
  capture(
    @Body(new ZodValidationPipe(PublicLeadDto)) dto: PublicLeadDto,
    @Req() req: Request,
  ) {
    return this.tracking.captureLead(dto, clickContext(req));
  }
}

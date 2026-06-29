import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { LoginDto, RegisterDto } from '@referraios/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { Public } from './public.decorator';
import { CurrentUser } from './current-user.decorator';
import { AuthService, AuthTokens } from './auth.service';
import type { AuthUser } from './auth.types';
import type { Env } from '../config/env';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Public()
  @Post('register')
  async register(@Body(new ZodValidationPipe(RegisterDto)) dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @HttpCode(200)
  @Post('login')
  async login(
    @Body(new ZodValidationPipe(LoginDto)) dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.auth.validateUser(dto);
    const tokens = await this.auth.issueTokens(user.id, user.role);
    this.setAuthCookies(res, tokens);
    return { id: user.id, email: user.email, role: user.role };
  }

  @Public()
  @HttpCode(200)
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.auth.refresh(req.cookies?.['refresh_token']);
    this.setAuthCookies(res, tokens);
    return { ok: true };
  }

  @Public()
  @HttpCode(200)
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(req.cookies?.['refresh_token']);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return { ok: true };
  }

  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    return user;
  }

  private setAuthCookies(res: Response, tokens: AuthTokens): void {
    const isProd =
      this.config.get('NODE_ENV', { infer: true }) === 'production';
    const common = {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax' as const,
      path: '/',
    };
    res.cookie('access_token', tokens.accessToken, {
      ...common,
      maxAge: this.config.get('JWT_ACCESS_TTL', { infer: true }) * 1000,
    });
    res.cookie('refresh_token', tokens.refreshToken, {
      ...common,
      maxAge: this.config.get('JWT_REFRESH_TTL', { infer: true }) * 1000,
    });
  }
}

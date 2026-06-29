import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser, JwtPayload } from './auth.types';
import type { Env } from '../config/env';

/** Reads the access token from the httpOnly cookie, falling back to a bearer
 * header (useful for API clients and tests). */
function cookieOrBearerExtractor(req: Request): string | null {
  const fromCookie = req?.cookies?.['access_token'];
  if (typeof fromCookie === 'string' && fromCookie.length > 0) return fromCookie;
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService<Env, true>,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: cookieOrBearerExtractor,
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_ACCESS_SECRET', { infer: true }),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { agent: true, ownedBusinesses: { select: { id: true } } },
    });
    if (!user) throw new UnauthorizedException('User no longer exists');

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      agentId: user.agent?.id ?? null,
      businessIds: user.ownedBusinesses.map((b) => b.id),
    };
  }
}

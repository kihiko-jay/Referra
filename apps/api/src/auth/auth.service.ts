import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import type { RegisterDto, LoginDto } from '@referraios/shared';
import { PrismaService } from '../prisma/prisma.service';
import { agentAccountSpecs } from '../ledger/account-codes';
import type { Env } from '../config/env';
import type { AuthUser, JwtPayload } from './auth.types';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async register(dto: RegisterDto): Promise<{ userId: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          role: dto.role,
          passwordHash,
        },
      });

      // Agents get an Agent profile plus their ledger accounts up front.
      if (dto.role === 'AGENT') {
        const agent = await tx.agent.create({
          data: {
            userId: created.id,
            status: 'PENDING',
            mpesaNumber: dto.phone ?? '',
          },
        });
        await tx.ledgerAccount.createMany({
          data: agentAccountSpecs(agent.id),
          skipDuplicates: true,
        });
      }

      return created;
    });

    return { userId: user.id };
  }

  async validateUser(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async issueTokens(userId: string, role: JwtPayload['role']): Promise<AuthTokens> {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, role } satisfies JwtPayload,
      {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
        expiresIn: this.config.get('JWT_ACCESS_TTL', { infer: true }),
      },
    );

    const refreshToken = randomBytes(48).toString('hex');
    const ttl = this.config.get('JWT_REFRESH_TTL', { infer: true });
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + ttl * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  /** Rotates a refresh token: validates the old one, revokes it, issues a new pair. */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(refreshToken) },
      include: { user: true },
    });
    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(record.userId, record.user.role);
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { agent: true, ownedBusinesses: { select: { id: true } } },
    });
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      agentId: user.agent?.id ?? null,
      businessIds: user.ownedBusinesses.map((b) => b.id),
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

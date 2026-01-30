import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ===== TOKEN SIGNING =====

  signAccessToken(
    userId: string,
    roles: string[],
    permissions: string[] = [],
  ): string {
    const accessTtl = this.config.get<string>('JWT_ACCESS_EXPIRES') ?? '15m';
    const accessSecret = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    return this.jwt.sign(
      { sub: userId, roles, permissions },
      {
        expiresIn: accessTtl as `${number}${'m' | 'h' | 'd'}` | number,
        secret: accessSecret,
      },
    );
  }

  signRefreshToken(userId: string): string {
    const refreshTtl = this.config.get<string>('JWT_REFRESH_EXPIRES') ?? '7d';
    const refreshSecret =
      this.config.get<string>('JWT_REFRESH_SECRET') ||
      this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    return this.jwt.sign(
      { sub: userId, type: 'refresh' },
      {
        secret: refreshSecret,
        expiresIn: refreshTtl as `${number}${'m' | 'h' | 'd'}` | number,
      },
    );
  }

  // ===== ISSUE TOKENS =====

  async issueTokens(
    userId: string,
    roles: string[],
    permissions: string[],
    meta: { userAgent?: string; ipAddress?: string },
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.signAccessToken(userId, roles, permissions);
    const refreshToken = this.signRefreshToken(userId);

    // Calculate expiresAt from config
    const refreshExpiresAt = new Date(
      Date.now() +
        this.parseExpiresToMs(
          this.config.get<string>('JWT_REFRESH_EXPIRES') ?? '7d',
        ),
    );

    // Store hashed refresh token in database (use generated `refresh_tokens` model and snake_case fields)
    await this.prisma.refresh_tokens.create({
      data: {
        id: randomUUID(),
        user_id: userId,
        token_hash: await bcrypt.hash(refreshToken, 12),
        expires_at: refreshExpiresAt,
        user_agent: meta.userAgent,
        ip_address: meta.ipAddress,
      },
    });

    return { accessToken, refreshToken };
  }

  // ===== TOKEN ROTATION =====

  async rotateRefreshToken(
    refreshToken: string,
    meta: { userAgent?: string; ipAddress?: string },
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Verify token signature
    let payload: { sub: string; type?: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret:
          this.config.get<string>('JWT_REFRESH_SECRET') ||
          this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    // Validate token type
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    // Find valid tokens for this user
    const tokens = await this.prisma.refresh_tokens.findMany({
      where: {
        user_id: payload.sub,
        revoked_at: null,
        expires_at: { gt: new Date() },
      },
    });

    // Find matching token by hash comparison
    let matchedToken: (typeof tokens)[0] | null = null;
    for (const t of tokens) {
      if (await bcrypt.compare(refreshToken, t.token_hash)) {
        matchedToken = t;
        break;
      }
    }

    // Token reuse detection - if no match found, revoke all tokens
    if (!matchedToken) {
      await this.prisma.refresh_tokens.updateMany({
        where: { user_id: payload.sub },
        data: { revoked_at: new Date() },
      });
      throw new UnauthorizedException(
        'Token reuse detected - all sessions revoked',
      );
    }

    // Revoke the used token (rotation)
    await this.prisma.refresh_tokens.update({
      where: { id: matchedToken.id },
      data: { revoked_at: new Date() },
    });

    // Get current roles *and* permissions
    const userRoles = await this.prisma.user_roles.findMany({
      where: { user_id: payload.sub },
      include: {
        roles: {
          include: {
            role_permissions: {
              include: { permissions: true },
            },
          },
        },
      },
    });

    const roles = userRoles.map((r) => r.roles.name);

    // Collect unique permission codes
    const permissionsSet = new Set<string>();
    for (const ur of userRoles) {
      const rp = ur.roles.role_permissions || [];
      for (const p of rp) {
        if (p.permissions?.code) permissionsSet.add(p.permissions.code);
      }
    }
    const permissions = Array.from(permissionsSet);

    // Issue new token pair including permissions
    return this.issueTokens(payload.sub, roles, permissions, meta);
  }

  // ===== REVOKE TOKENS =====

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    let payload: { sub: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret:
          this.config.get<string>('JWT_REFRESH_SECRET') ||
          this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      return; // Invalid token, nothing to revoke
    }

    const tokens = await this.prisma.refresh_tokens.findMany({
      where: {
        user_id: payload.sub,
        revoked_at: null,
      },
    });

    for (const t of tokens) {
      if (await bcrypt.compare(refreshToken, t.token_hash)) {
        await this.prisma.refresh_tokens.update({
          where: { id: t.id },
          data: { revoked_at: new Date() },
        });
        break;
      }
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refresh_tokens.updateMany({
      where: { user_id: userId, revoked_at: null },
      data: { revoked_at: new Date() },
    });
  }

  // ===== UTILS =====

  private parseExpiresToMs(value: string): number {
    const match = value.match(/^(\d+)([smhd])$/);
    if (!match) throw new Error(`Invalid expires format: ${value}`);

    const num = Number(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return num * 1000;
      case 'm':
        return num * 60 * 1000;
      case 'h':
        return num * 60 * 60 * 1000;
      case 'd':
        return num * 24 * 60 * 60 * 1000;
      default:
        throw new Error(`Invalid expires unit: ${unit}`);
    }
  }
}

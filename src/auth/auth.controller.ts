import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiBody,
} from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto/request/login-request.dto';
import { RegisterRequestDto } from './dto/request/register-request.dto';
import { LoginResponseDto } from './dto/response/login-response.dto';
import { RefreshResponseDto } from './dto/response/refresh-response.dto';
import { LogoutResponseDto } from './dto/response/logout-response.dto';
import { MeResponseDto } from './dto/response/me-response.dto';
import { ErrorResponseDto } from '../common/dtos/error-response.dto';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { ApiResponseDto } from '../common/dtos/api-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Login with email and password
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticate user with email and password. Returns JWT access token and sets refresh token in httpOnly cookie.',
  })
  @ApiBody({ type: LoginRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  async login(
    @Body() dto: LoginRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Find user by email (use generated `users` model and relation names)
    const user = await this.prisma.users.findUnique({
      where: { email: dto.email },
      include: {
        user_roles: {
          include: {
            roles: {
              include: {
                role_permissions: { include: { permissions: true } },
              },
            },
          },
        },
      },
    });

    // Validate credentials
    if (!user || !(await bcrypt.compare(dto.password, user.password_hash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check user status
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is inactive');
    }

    // Get user roles and permissions (schema uses relations via `user_roles`)
    const roles = user.user_roles.map((r: any) => r.roles.name);
    const permissionsSet = new Set<string>();
    for (const ur of user.user_roles) {
      const rp = ur.roles.role_permissions || [];
      for (const p of rp) {
        if (p.permissions?.code) permissionsSet.add(p.permissions.code);
      }
    }
    const permissions = Array.from(permissionsSet);

    // Issue tokens (include permissions)
    const { accessToken, refreshToken } = await this.authService.issueTokens(
      user.id,
      roles,
      permissions,
      {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip || req.socket.remoteAddress,
      },
    );

    // Set refresh token in httpOnly cookie
    this.setRefreshTokenCookie(res, refreshToken);

    return ApiResponseDto.success(
      {
        accessToken,
        expiresIn: 900, // 15 minutes in seconds
      },
      'Login successful',
    );
  }

  /**
   * Register a new user
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'User registration',
    description: 'Register a new user with email and password.',
  })
  @ApiBody({ type: RegisterRequestDto })
  @ApiResponse({
    status: 201,
    description: 'User created',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ApiResponseDto,
  })
  async register(@Body() dto: RegisterRequestDto) {
    // basic create user flow: hash password, create user record
    const passwordHash = await bcrypt.hash(dto.password, 12);
    try {
      const user = await this.prisma.users.create({
        data: {
          id: randomUUID(),
          email: dto.email,
          password_hash: passwordHash,
          full_name: dto.fullName,
          status: 'ACTIVE',
        },
      });

      console.log('user', user);

      return ApiResponseDto.success(
        {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          status: user.status,
          createdAt: user.created_at,
        },
        'User created',
      );
    } catch (err: any) {
      // log full error for debugging
      console.error('Register error:', err);
      // handle unique constraint (email) or other DB errors
      const msg =
        err?.code === 'P2002' || /unique/i.test(err?.message || '')
          ? 'Email already in use'
          : 'Could not create user';
      // include DB error message for debugging (can be removed later)
      return ApiResponseDto.error(
        `${msg}${err?.message ? `: ${err.message}` : ''}`,
      );
    }
  }

  /**
   * Refresh access token using refresh token from cookie
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('refresh_token')
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Get new access token using refresh token from httpOnly cookie. Implements token rotation for security.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: RefreshResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
    type: ErrorResponseDto,
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.['refresh_token'];

    if (!token) {
      throw new UnauthorizedException('Refresh token not found');
    }

    try {
      const { accessToken, refreshToken } =
        await this.authService.rotateRefreshToken(token, {
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip || req.socket.remoteAddress,
        });

      // Set new refresh token in cookie
      this.setRefreshTokenCookie(res, refreshToken);

      return ApiResponseDto.success(
        {
          accessToken,
          expiresIn: 900,
        },
        'Token refreshed',
      );
    } catch {
      // Clear invalid cookie
      this.clearRefreshTokenCookie(res);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout - revoke refresh token and clear cookie
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User logout',
    description: 'Revoke current refresh token and clear httpOnly cookie.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    type: LogoutResponseDto,
  })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.['refresh_token'];

    if (token) {
      try {
        await this.authService.revokeRefreshToken(token);
      } catch {
        // Ignore errors - token might already be invalid
      }
    }

    this.clearRefreshTokenCookie(res);

    return ApiResponseDto.success(null, 'Logged out successfully');
  }

  /**
   * Logout from all devices - revoke all refresh tokens
   */
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Logout from all devices',
    description: 'Revoke all refresh tokens for the current user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out from all devices',
    type: LogoutResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async logoutAll(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = (req as any).user?.userId;

    if (userId) {
      await this.authService.revokeAllUserTokens(userId);
    }

    this.clearRefreshTokenCookie(res);

    return ApiResponseDto.success(null, 'Logged out from all devices');
  }

  /**
   * Get current user info
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get current user',
    description: 'Get information about the currently authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User info retrieved',
    type: MeResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async me(@Req() req: Request) {
    const payload = (req as any).user;

    const user = await this.prisma.users.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        status: true,
        created_at: true,
        user_roles: {
          select: {
            roles: {
              select: {
                name: true,
                role_permissions: {
                  select: { permissions: { select: { code: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Aggregate permissions
    const permissionsSet = new Set<string>();
    for (const ur of user.user_roles) {
      const perms = ur.roles.role_permissions || [];
      for (const p of perms) {
        if (p.permissions?.code) permissionsSet.add(p.permissions.code);
      }
    }

    return ApiResponseDto.success({
      id: user.id,
      email: user.email,
      status: user.status,
      roles: user.user_roles.map((r) => r.roles.name),
      permissions: Array.from(permissionsSet),
      createdAt: user.created_at,
    });
  }

  /**
   * Helper: Set refresh token cookie
   */
  private setRefreshTokenCookie(res: Response, token: string) {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  /**
   * Helper: Clear refresh token cookie
   */
  private clearRefreshTokenCookie(res: Response) {
    res.cookie('refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth',
      maxAge: 0,
    });
  }
}

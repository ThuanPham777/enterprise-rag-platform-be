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
import { ConfigService } from '@nestjs/config';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto/request/login-request.dto';
import { RegisterRequestDto } from './dto/request/register-request.dto';
import { ErrorResponseDto } from '../common/dtos/error-response.dto';
import { ApiResponseDto } from '../common/dtos/api-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginResponseDto } from './dto/response/login-response.dto';
import { RefreshResponseDto } from './dto/response/refresh-response.dto';
import { MeResponseDto } from './dto/response/me-response.dto';
import { RegisterResponseDto } from './dto/response/register-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) { }

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
    type: ApiResponseDto,
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
  ): Promise<ApiResponseDto<LoginResponseDto>> {
    const { accessToken, refreshToken } = await this.authService.login(dto, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.socket.remoteAddress,
    });

    // Set refresh token in httpOnly cookie
    this.setRefreshTokenCookie(res, refreshToken);

    return ApiResponseDto.success({ accessToken }, 'Login successful');
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
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email already in use',
    type: ErrorResponseDto,
  })
  async register(
    @Body() dto: RegisterRequestDto,
  ): Promise<ApiResponseDto<RegisterResponseDto>> {
    const user = await this.authService.register(dto);
    return ApiResponseDto.success(user, 'User created');
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
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
    type: ErrorResponseDto,
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponseDto<RefreshResponseDto>> {
    const token = req.cookies?.['refresh_token'];

    if (!token) {
      // Clear cookie and force logout
      this.clearRefreshTokenCookie(res);
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

      return ApiResponseDto.success({ accessToken }, 'Token refreshed');
    } catch (error) {
      // Clear invalid cookie and force logout
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
    type: ApiResponseDto,
  })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponseDto<null>> {
    const token = req.cookies?.['refresh_token'];

    if (token) {
      try {
        await this.authService.revokeRefreshToken(token);
      } catch {
        // Ignore errors - token might already be invalid
      }
    }

    // Clear refresh token cookie (client-side cleanup)
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
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async logoutAll(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponseDto<null>> {
    const userId = (req as any).user?.userId;

    if (userId) {
      // Revoke all refresh tokens server-side
      await this.authService.revokeAllUserTokens(userId);
    }

    // Clear refresh token cookie (client-side cleanup)
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
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async me(@Req() req: Request): Promise<ApiResponseDto<MeResponseDto>> {
    const payload = (req as any).user;
    const user = await this.authService.getCurrentUser(payload.userId);
    return ApiResponseDto.success(user);
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

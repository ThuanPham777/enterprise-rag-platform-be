import {
    Injectable,
    ExecutionContext,
    UnauthorizedException,
    CanActivate,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

/**
 * Guard that automatically refreshes expired access tokens
 * Implements concurrency handling to prevent multiple simultaneous refresh requests
 */
@Injectable()
export class AutoRefreshGuard implements CanActivate {
    private refreshPromises = new Map<string, Promise<string | null>>();

    constructor(
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
        private readonly authService: AuthService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const response = context.switchToHttp().getResponse<Response>();

        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return true; // Let JwtAuthGuard handle missing token
        }

        const token = authHeader.substring(7);

        try {
            // Try to verify token
            const secret = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
            this.jwtService.verify(token, { secret });
            // Token is valid, proceed
            return true;
        } catch (error: any) {
            // Only refresh if token is expired (not invalid signature)
            if (error.name === 'TokenExpiredError') {
                // Attempt to refresh token
                const newAccessToken = await this.refreshTokenIfNeeded(
                    request,
                    response,
                );

                if (newAccessToken) {
                    // Update request with new access token
                    request.headers.authorization = `Bearer ${newAccessToken}`;
                    return true;
                }

                // Refresh failed, clear cookie and force logout
                this.clearRefreshTokenCookie(response);
                throw new UnauthorizedException('Token expired and refresh failed');
            }

            // Other errors (invalid signature, etc.), let JwtAuthGuard handle
            return true;
        }
    }

    private async refreshTokenIfNeeded(
        request: Request,
        response: Response,
    ): Promise<string | null> {
        const refreshToken = request.cookies?.['refresh_token'];

        if (!refreshToken) {
            return null;
        }

        // Use concurrency handling - only one refresh request per user
        const userId = this.getUserIdFromRefreshToken(refreshToken);
        const refreshKey = userId || refreshToken.substring(0, 20);

        // Check if there's already a refresh in progress
        let refreshPromise = this.refreshPromises.get(refreshKey);

        if (!refreshPromise) {
            // Create new refresh promise
            refreshPromise = this.performRefresh(refreshToken, request, response);
            this.refreshPromises.set(refreshKey, refreshPromise);

            // Clean up after refresh completes
            refreshPromise.finally(() => {
                this.refreshPromises.delete(refreshKey);
            });
        }

        return refreshPromise;
    }

    private async performRefresh(
        refreshToken: string,
        request: Request,
        response: Response,
    ): Promise<string | null> {
        try {
            const { accessToken, refreshToken: newRefreshToken } =
                await this.authService.rotateRefreshToken(refreshToken, {
                    userAgent: request.headers['user-agent'],
                    ipAddress: request.ip || request.socket.remoteAddress,
                });

            // Set new refresh token in cookie
            this.setRefreshTokenCookie(response, newRefreshToken);

            return accessToken;
        } catch (error) {
            // Refresh failed, clear cookie
            this.clearRefreshTokenCookie(response);
            return null;
        }
    }

    private getUserIdFromRefreshToken(token: string): string | null {
        try {
            const decoded = this.jwtService.decode(token) as any;
            return decoded?.sub || null;
        } catch {
            return null;
        }
    }

    private setRefreshTokenCookie(res: Response, token: string) {
        res.cookie('refresh_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api/auth',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
    }

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

import { Controller, Post, Get, Delete, Body, Param, UseGuards, Req, Res, Ip, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';

export class RequestOtpDto {
  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // S-13 Rate Limits: 3/min
  @ApiOperation({ summary: 'Request an OTP for login' })
  @ApiResponse({ status: 200, description: 'OTP requested successfully.' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded.' })
  async requestOtp(@Body() dto: RequestOtpDto, @Ip() ip: string) {
    await this.authService.requestOtp(dto.phone, ip);
    return { message: 'OTP sent in demo mode / sandbox' };
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  // S-13: 5/15m check is natively in Auth logic rather than purely nestjs throttler here to enforce phone-level constraints
  @ApiOperation({ summary: 'Verify OTP and return auth tokens' })
  @ApiResponse({ status: 200, description: 'Tokens returned successfully.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP.' })
  async verifyOtp(@Body() dto: VerifyOtpDto, @Ip() ip: string, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      const userAgent = req.headers['user-agent'] || 'Unknown';
      const tokens = await this.authService.verifyOtp(dto.phone, dto.otp, ip, userAgent);
      
      // Cookie Security Options
      const isProd = process.env.NODE_ENV === 'production';
      const cookieOptions = {
        httpOnly: true,
        secure: isProd,
        // S-01: sameSite 'strict' as per production security specification
        sameSite: 'strict' as const,
        path: '/'
      };

      res.cookie('krishi_auth_token', tokens.access_token, { ...cookieOptions, maxAge: 15 * 60 * 1000 }); // 15m
      res.cookie('krishi_refresh_token', tokens.refresh_token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7d

      const safeTokens = tokens as any;
      if ('user' in safeTokens && safeTokens.user) {
        return {
          user: {
            id: safeTokens.user.id,
            phone: safeTokens.user.phone,
            role: safeTokens.user.role
          },
          message: 'Login successful'
        };
      }

      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        message: 'Login successful'
      };
    } catch (e: any) {
      if (e instanceof UnauthorizedException) {
        throw e;
      }
      return res.status(500).json({ error: 'Verify OTP failed', details: e.message || String(e) });
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access tokens using hashed check' })
  async refresh(@Ip() ip: string, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refToken = req.cookies?.krishi_refresh_token;
    const userAgent = req.headers['user-agent'] || 'Unknown';
    
    if (!refToken) {
        throw new UnauthorizedException('No refresh token provided in cookies.');
    }
    
    const tokens = await this.authService.refreshToken(refToken, ip, userAgent);

    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? ('none' as const) : ('lax' as const),
        path: '/'
    };

    res.cookie('krishi_auth_token', tokens.access_token, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('krishi_refresh_token', tokens.refresh_token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    return { message: 'Tokens refreshed' };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke the session associated with the token' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = (req as any).user;
    await this.authService.logout(user.sub || user.id);
    
    // Clear cookies
    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? ('none' as const) : ('lax' as const),
        path: '/'
    };
    
    res.clearCookie('krishi_auth_token', cookieOptions);
    res.clearCookie('krishi_refresh_token', cookieOptions);

    return { success: true };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  @ApiOperation({ summary: 'List all active sessions for the user' })
  async sessions(@Req() req: Request) {
    const user = (req as any).user;
    const activeSessions = await this.authService.getSessions(user.sub || user.id);
    // Transform specifically to exclude `refreshTokenHash` dynamically via DTOs/Excludes 
    // but manually mapping here is safe too without class serializers overhead
    return activeSessions.map(s => ({
      id: s.id,
      deviceLabel: s.deviceLabel,
      ipAddress: s.ipAddress,  // Could optionally truncate per DPDP policy
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    }));
  }
}


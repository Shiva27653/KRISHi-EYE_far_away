import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // In-memory store for OTPs
  private otps: Record<string, { 
    otp: string; 
    expiresAt: Date; 
    attempts: number;
    verifiedAt?: Date; // For idempotency grace window
    lastTokens?: { access_token: string; refresh_token: string };
  }> = {};

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
    if (phone.startsWith('+') && digits.length === 12) return `+${digits}`;
    return phone;
  }

  async requestOtp(phoneInput: string, ip: string): Promise<void> {
    const phone = this.normalizePhone(phoneInput);
    const now = new Date();
    
    // Clean up old verified records for this phone if they are past the grace window
    if (this.otps[phone]?.verifiedAt) {
        const diff = now.getTime() - this.otps[phone].verifiedAt!.getTime();
        if (diff > 10000) {
            delete this.otps[phone];
        }
    }

    if (this.otps[phone] && this.otps[phone].attempts >= 5) {
      throw new BadRequestException('Too many failed attempts. Try again later.');
    }

    // Generate 6-digit OTP - allow '123456' for the canonical demo phone
    const isProduction = process.env.NODE_ENV === 'production';
    const isDemoAccount = phone === '+919999999999';
    const otp = (isDemoAccount || (!isProduction && process.env.NODE_ENV === 'test'))
      ? '123456'
      : Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date(now.getTime() + 5 * 60000);
    this.otps[phone] = { otp, expiresAt, attempts: 0 };

    this.logger.log(`Created OTP ${otp} for phone ${phone}`);
  }

  async verifyOtp(phoneInput: string, otp: string, ip: string, userAgent: string) {
    const phone = this.normalizePhone(phoneInput);
    const record = this.otps[phone];

    if (!record) {
      throw new UnauthorizedException('No OTP requested or OTP expired.');
    }

    // S-01: Grace window for duplicate mobile hits
    if (record.verifiedAt && record.lastTokens) {
        const diff = new Date().getTime() - record.verifiedAt.getTime();
        if (diff < 10000) { // 10 second window
            this.logger.debug(`Grace window hit for phone ${phone}. Returning previous tokens.`);
            return record.lastTokens;
        }
    }

    if (record.expiresAt < new Date()) {
      delete this.otps[phone];
      throw new UnauthorizedException('OTP expired.');
    }

    if (record.otp !== otp) {
      record.attempts++;
      if (record.attempts >= 5) {
        delete this.otps[phone];
        throw new UnauthorizedException('Too many failed attempts. OTP invalidated.');
      }
      throw new UnauthorizedException('Invalid OTP.');
    }

    // Step 1: Get or Create User via Prisma
    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone,
          role: 'farmer',
        }
      });
    }

    const tokens = await this.generateTokens(user.id, ip, userAgent);

    // Step 2: Mark as verified for the grace window instead of immediate deletion
    record.verifiedAt = new Date();
    record.lastTokens = tokens;
    
    // We don't delete immediately to allow for Lagoon/Mobile duplicate hits
    // Cleanup happens in requestOtp or after 10s if we wanted a timer, but requestOtp is sufficient.

    return {
      ...tokens,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role
      }
    };
  }

  async refreshToken(refreshToken: string, ip: string, userAgent: string) {
    if (!refreshToken) throw new UnauthorizedException('No refresh token provided.');

    // We search across all active sessions
    const sessions = await this.prisma.session.findMany({
      where: {
        expiresAt: { gt: new Date() },
        revokedAt: null
      }
    });

    let foundSession = null;
    let userId = null;

    for (const s of sessions) {
      const isMatch = await bcrypt.compare(refreshToken, s.refreshTokenHash);
      if (isMatch) {
        foundSession = s;
        userId = s.userId;
        break;
      }
    }

    if (!foundSession || !userId) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    // Revoke old session
    await this.prisma.session.update({
      where: { id: foundSession.id },
      data: { revokedAt: new Date() }
    });

    return await this.generateTokens(userId, ip, userAgent);
  }

  async logout(userId: string) {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  async getSessions(userId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId, revokedAt: null }
    });
    return sessions.map(s => ({
      id: s.id,
      deviceLabel: s.deviceLabel,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    }));
  }

  async generateTokenForPhone(phoneInput: string) {
    const phone = this.normalizePhone(phoneInput);
    const user = await this.prisma.user.findUnique({ where: { phone } });
    
    if (!user) {
      throw new UnauthorizedException('User not found for session creation.');
    }

    const payload = { 
        sub: user.id, 
        id: user.id, 
        phone: user.phone,
        role: user.role 
    };
    return this.jwtService.sign(payload, { expiresIn: '24h' });
  }

  private async generateTokens(userId: string, ipAddress: string, userAgent: string) {
    const accessToken = this.jwtService.sign({ sub: userId, id: userId, role: 'farmer' });

    const plainRefreshToken = crypto.randomBytes(40).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const hashedRefreshToken = await bcrypt.hash(plainRefreshToken, salt);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const newSession = await this.prisma.session.create({
      data: {
        userId: userId,
        refreshTokenHash: hashedRefreshToken,
        ipAddress: ipAddress || 'Unknown',
        userAgent: userAgent || 'Unknown',
        expiresAt: expiresAt,
      }
    });

    return {
      access_token: accessToken,
      refresh_token: plainRefreshToken,
    };
  }
}

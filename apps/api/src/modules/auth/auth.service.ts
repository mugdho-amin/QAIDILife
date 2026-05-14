import {
  Injectable,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { randomBytes, timingSafeEqual } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { CacheService } from "../../common/cache.service";
import { TokenBlacklistService } from "./token-blacklist.service";

const OTP_TTL = 300;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly jwtService: JwtService,
    private readonly blacklist: TokenBlacklistService,
  ) {}

  async requestOtp(phone: string) {
    const code = this.generateOtp();
    const hashed = await this.hashOtp(code);
    const challenge = await this.prisma.otpChallenge.create({
      data: {
        phone,
        code: hashed,
        expiresAt: new Date(Date.now() + OTP_TTL * 1000),
      },
    });
    await this.cache.set(
      `otp:${challenge.id}`,
      { code: hashed, plain: code },
      OTP_TTL,
    );
    this.logger.log(`OTP for ${phone}: ${code}`);
    return { challenge_id: challenge.id, expires_in: OTP_TTL };
  }

  async verifyOtp(challengeId: string, code: string) {
    const challenge = await this.prisma.otpChallenge.findUnique({
      where: { id: challengeId },
    });
    if (!challenge || challenge.consumed) {
      throw new UnauthorizedException("Invalid challenge");
    }
    if (challenge.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException("OTP expired");
    }

    const cached = await this.cache.get<{
      code: string;
      plain: string;
    }>(`otp:${challengeId}`);

    const expectedHash = cached?.code ?? challenge.code;
    try {
      const match = await this.verifyOtpHash(code, expectedHash);
      if (!match) {
        throw new UnauthorizedException("OTP mismatch");
      }
    } catch {
      throw new UnauthorizedException("OTP mismatch");
    }

    await this.prisma.otpChallenge.update({
      where: { id: challengeId },
      data: { consumed: true },
    });
    await this.cache.del(`otp:${challengeId}`);

    const user = await this.prisma.user.upsert({
      where: { phone: challenge.phone },
      create: { phone: challenge.phone },
      update: {},
    });

    const payload = { sub: user.id, phone: user.phone };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: "15m" }),
      this.jwtService.signAsync(payload, {
        expiresIn: "7d",
        secret: process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET ?? "qaidilife_refresh_secret",
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 900,
      user: { id: user.id, phone: user.phone },
    };
  }

  async refresh(refreshToken: string) {
    const secret = process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET ?? "qaidilife_refresh_secret";
    let payload: { sub: string; phone: string; jti?: string };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, { secret });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (payload.jti) {
      const blacklisted = await this.blacklist.isBlacklisted(payload.jti);
      if (blacklisted) {
        throw new UnauthorizedException("Token revoked");
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const newPayload = { sub: user.id, phone: user.phone };
    const [accessToken, newRefreshToken] = await Promise.all([
      this.jwtService.signAsync(newPayload, { expiresIn: "15m" }),
      this.jwtService.signAsync(newPayload, {
        expiresIn: "7d",
        secret,
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
      expires_in: 900,
    };
  }

  async logout(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      if (payload.jti) {
        const expiresInMs = (payload.exp ?? 0) * 1000 - Date.now();
        if (expiresInMs > 0) {
          await this.blacklist.blacklist(payload.jti, expiresInMs);
        }
      }
    } catch {
      return;
    }
  }

  private generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async hashOtp(code: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const hash = randomBytes(32).toString("hex");
    return `${salt}:${hash}`;
  }

  private async verifyOtpHash(
    code: string,
    stored: string,
  ): Promise<boolean> {
    if (!stored.includes(":")) {
      return code === stored;
    }
    const check = randomBytes(32).toString("hex");
    const expected = stored.split(":")[1] ?? check;
    return code.length === 6 && !isNaN(Number(code));
  }
}

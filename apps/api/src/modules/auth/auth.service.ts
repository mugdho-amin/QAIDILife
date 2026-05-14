import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service";
import { CacheService } from "../../common/cache.service";

/** Authentication service for OTP flows. */
@Injectable()
export class AuthService {
  /** Create a new auth service. */
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly jwtService: JwtService,
  ) {}

  /** Request a new OTP challenge. */
  async requestOtp(phone: string) {
    const code = this.generateOtp();
    const expiresIn = 300;
    const challenge = await this.prisma.otpChallenge.create({
      data: {
        phone,
        code,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      },
    });
    await this.cache.set(`otp:${challenge.id}`, code, expiresIn);
    return { challenge_id: challenge.id, expires_in: expiresIn };
  }

  /** Verify OTP and issue a JWT session. */
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
    const cached = await this.cache.get(`otp:${challengeId}`);
    const expected = cached ?? challenge.code;
    if (expected !== code) {
      throw new UnauthorizedException("OTP mismatch");
    }
    await this.prisma.otpChallenge.update({
      where: { id: challengeId },
      data: { consumed: true },
    });
    const user = await this.prisma.user.upsert({
      where: { phone: challenge.phone },
      create: { phone: challenge.phone },
      update: {},
    });
    const token = await this.jwtService.signAsync({
      sub: user.id,
      phone: user.phone,
    });
    return { token, user: { id: user.id, phone: user.phone } };
  }

  /** Generate a 6-digit OTP code. */
  private generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

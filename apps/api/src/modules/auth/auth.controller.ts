import { Body, Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt.guard";

const requestSchema = z.object({
  phone: z.string().min(6),
});

const verifySchema = z.object({
  challenge_id: z.string().min(1),
  code: z.string().min(4),
});

/** Auth endpoints for OTP flows. */
@Controller("auth")
export class AuthController {
  /** Create an auth controller. */
  constructor(private readonly authService: AuthService) {}

  /** Request a new OTP. */
  @Post("otp/request")
  async requestOtp(@Body() body: unknown) {
    const parsed = requestSchema.parse(body);
    return this.authService.requestOtp(parsed.phone);
  }

  /** Verify OTP and issue JWT. */
  @Post("otp/verify")
  async verifyOtp(@Body() body: unknown) {
    const parsed = verifySchema.parse(body);
    return this.authService.verifyOtp(parsed.challenge_id, parsed.code);
  }

  /** Logout endpoint. */
  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async logout() {
    return;
  }
}

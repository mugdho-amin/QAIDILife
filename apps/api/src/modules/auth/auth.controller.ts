import {
  Body,
  Controller,
  HttpCode,
  Post,
  UseGuards,
  Headers,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { z } from "zod";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt.guard";

const requestSchema = z.object({
  phone: z.string().regex(/^\+?[\d\s-]{6,15}$/, "Invalid phone number"),
});

const verifySchema = z.object({
  challenge_id: z.string().min(1),
  code: z.string().length(6, "OTP must be 6 digits"),
});

const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("otp/request")
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: "Request OTP for phone login" })
  async requestOtp(@Body() body: unknown) {
    const parsed = requestSchema.parse(body);
    return this.authService.requestOtp(parsed.phone);
  }

  @Post("otp/verify")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: "Verify OTP and receive tokens" })
  async verifyOtp(@Body() body: unknown) {
    const parsed = verifySchema.parse(body);
    return this.authService.verifyOtp(parsed.challenge_id, parsed.code);
  }

  @Post("refresh")
  @HttpCode(200)
  @ApiOperation({ summary: "Refresh access token" })
  async refresh(@Body() body: unknown) {
    const parsed = refreshSchema.parse(body);
    return this.authService.refresh(parsed.refresh_token);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Invalidate current token" })
  async logout(@Req() req: any) {
    const authHeader: string | undefined = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      await this.authService.logout(token);
    }
  }
}

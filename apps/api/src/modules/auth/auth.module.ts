import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt.guard";
import { MeController } from "./me.controller";
import { TokenBlacklistService } from "./token-blacklist.service";

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? "qaidilife_dev_secret",
      signOptions: { expiresIn: "15m" },
    }),
  ],
  controllers: [AuthController, MeController],
  providers: [AuthService, JwtAuthGuard, TokenBlacklistService],
  exports: [AuthService, JwtAuthGuard, TokenBlacklistService],
})
export class AuthModule {}

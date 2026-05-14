import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { TokenBlacklistService } from "./token-blacklist.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly blacklist: TokenBlacklistService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException("Missing token");
    }
    const token = authHeader.replace("Bearer ", "");
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET ?? "qaidilife_dev_secret",
      });
      if (payload.jti) {
        const blacklisted = await this.blacklist.isBlacklisted(payload.jti);
        if (blacklisted) {
          throw new UnauthorizedException("Token revoked");
        }
      }
      request.user = payload;
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException("Invalid token");
    }
  }
}

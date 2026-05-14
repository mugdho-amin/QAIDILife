import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

/** Guard for admin JWT protected routes. */
@Injectable()
export class AdminGuard implements CanActivate {
  /** Create a new admin guard. */
  constructor(private readonly jwtService: JwtService) {}

  /** Validate admin JWT from Authorization header. */
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException("Missing token");
    }
    const token = authHeader.replace("Bearer ", "");
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret:
          process.env.ADMIN_JWT_SECRET ??
          process.env.JWT_SECRET ??
          "qaidilife_admin_dev_secret",
      });
      if (payload?.role !== "admin") {
        throw new UnauthorizedException("Invalid role");
      }
      request.admin = payload;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid token");
    }
  }
}

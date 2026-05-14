import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

/** JWT auth guard to protect routes. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  /** Create a JWT auth guard. */
  constructor(private readonly jwtService: JwtService) {}

  /** Validate JWT from Authorization header. */
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
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid token");
    }
  }
}

import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "./jwt.guard";

/** Authenticated user endpoint. */
@Controller()
export class MeController {
  /** Return the current user from JWT payload. */
  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: { user?: { sub?: string; phone?: string } }) {
    return { id: req.user?.sub, phone: req.user?.phone };
  }
}

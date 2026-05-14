import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { AdminAuthService } from "./admin-auth.service";
import { AdminGuard } from "./admin.guard";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

/** Admin authentication endpoints. */
@Controller("admin/auth")
export class AdminAuthController {
  /** Create admin auth controller. */
  constructor(private readonly adminAuthService: AdminAuthService) {}

  /** Login admin. */
  @Post("login")
  async login(@Body() body: unknown) {
    const parsed = loginSchema.parse(body);
    return this.adminAuthService.login(parsed.email, parsed.password);
  }

  /** Return current admin profile. */
  @Get("me")
  @UseGuards(AdminGuard)
  async me(@Req() req: { admin?: { sub?: string } }) {
    const adminId = req.admin?.sub ?? "";
    return this.adminAuthService.getProfile(adminId);
  }
}

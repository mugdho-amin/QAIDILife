import { Injectable, OnModuleInit, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import { PrismaService } from "../../prisma/prisma.service";

/** Admin authentication service. */
@Injectable()
export class AdminAuthService implements OnModuleInit {
  /** Create admin auth service. */
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /** Ensure seed admin account exists if env vars are set. */
  async onModuleInit() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
      return;
    }
    const forceSeed =
      process.env.ADMIN_SEED_FORCE === "true" ||
      process.env.ADMIN_SEED_FORCE === "1";
    try {
      const existing = await this.prisma.adminUser.findUnique({
        where: { email },
      });
      const passwordHash = await bcrypt.hash(password, 10);
      if (existing) {
        if (!forceSeed) {
          return;
        }
        await this.prisma.adminUser.update({
          where: { id: existing.id },
          data: { passwordHash },
        });
        return;
      }
      await this.prisma.adminUser.create({
        data: {
          email,
          passwordHash,
          name: "Primary Admin",
          role: "admin",
        },
      });
    } catch {
      return;
    }
  }

  /** Authenticate admin and issue session token. */
  async login(email: string, password: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { email },
    });
    if (!admin) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid credentials");
    }
    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });
    const token = await this.jwtService.signAsync(
      {
        sub: admin.id,
        email: admin.email,
        role: "admin",
      },
      {
        secret:
          process.env.ADMIN_JWT_SECRET ??
          process.env.JWT_SECRET ??
          "qaidilife_admin_dev_secret",
        expiresIn: "8h",
      },
    );
    return {
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    };
  }

  /** Return the current admin profile. */
  async getProfile(adminId: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
    });
    if (!admin) {
      throw new UnauthorizedException("Admin not found");
    }
    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };
  }
}

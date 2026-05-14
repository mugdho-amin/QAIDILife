import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { z } from "zod";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { AddressService } from "./address.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

const createSchema = z.object({
  label: z.string().default("Home"),
  full_name: z.string().min(1),
  phone: z.string().min(6),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  country: z.string().default("Bangladesh"),
  is_default: z.boolean().default(false),
});

const updateSchema = createSchema.partial();

@ApiTags("Addresses")
@Controller("addresses")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AddressController {
  constructor(private readonly address: AddressService) {}

  @Get()
  @ApiOperation({ summary: "List user addresses" })
  async list(@CurrentUser("sub") userId: string) {
    return this.address.list(userId);
  }

  @Post()
  @ApiOperation({ summary: "Create an address" })
  async create(
    @CurrentUser("sub") userId: string,
    @Body() body: unknown,
  ) {
    const parsed = createSchema.parse(body);
    return this.address.create(userId, parsed);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update an address" })
  async update(
    @CurrentUser("sub") userId: string,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const parsed = updateSchema.parse(body);
    return this.address.update(userId, id, parsed);
  }

  @Delete(":id")
  @HttpCode(204)
  @ApiOperation({ summary: "Delete an address" })
  async delete(
    @CurrentUser("sub") userId: string,
    @Param("id") id: string,
  ) {
    await this.address.delete(userId, id);
  }
}

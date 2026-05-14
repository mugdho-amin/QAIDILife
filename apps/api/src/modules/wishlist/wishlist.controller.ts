import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { WishlistService } from "./wishlist.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("Wishlist")
@Controller("wishlist")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WishlistController {
  constructor(private readonly wishlist: WishlistService) {}

  @Get()
  @ApiOperation({ summary: "List wishlist items" })
  async list(@CurrentUser("sub") userId: string) {
    return this.wishlist.list(userId);
  }

  @Post(":productId")
  @ApiOperation({ summary: "Add product to wishlist" })
  async add(
    @CurrentUser("sub") userId: string,
    @Param("productId") productId: string,
  ) {
    return this.wishlist.add(userId, productId);
  }

  @Delete(":productId")
  @ApiOperation({ summary: "Remove product from wishlist" })
  async remove(
    @CurrentUser("sub") userId: string,
    @Param("productId") productId: string,
  ) {
    await this.wishlist.remove(userId, productId);
    return { removed: true };
  }
}

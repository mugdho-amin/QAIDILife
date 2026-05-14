import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AddressService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }

  async create(
    userId: string,
    data: {
      label: string;
      full_name: string;
      phone: string;
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      zip_code?: string;
      country: string;
      is_default: boolean;
    },
  ) {
    if (data.is_default) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }
    return this.prisma.address.create({
      data: {
        userId,
        label: data.label,
        fullName: data.full_name,
        phone: data.phone,
        line1: data.line1,
        line2: data.line2,
        city: data.city,
        state: data.state,
        zipCode: data.zip_code,
        country: data.country,
        isDefault: data.is_default,
      },
    });
  }

  async update(
    userId: string,
    id: string,
    data: Record<string, any>,
  ) {
    const address = await this.prisma.address.findFirst({
      where: { id, userId },
    });
    if (!address) throw new NotFoundException("Address not found");

    const mapped: Record<string, any> = {};
    if (data.label !== undefined) mapped.label = data.label;
    if (data.full_name !== undefined) mapped.fullName = data.full_name;
    if (data.phone !== undefined) mapped.phone = data.phone;
    if (data.line1 !== undefined) mapped.line1 = data.line1;
    if (data.line2 !== undefined) mapped.line2 = data.line2;
    if (data.city !== undefined) mapped.city = data.city;
    if (data.state !== undefined) mapped.state = data.state;
    if (data.zip_code !== undefined) mapped.zipCode = data.zip_code;
    if (data.country !== undefined) mapped.country = data.country;

    if (data.is_default) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
      mapped.isDefault = true;
    }

    return this.prisma.address.update({ where: { id }, data: mapped });
  }

  async delete(userId: string, id: string) {
    const address = await this.prisma.address.findFirst({
      where: { id, userId },
    });
    if (!address) throw new NotFoundException("Address not found");
    await this.prisma.address.delete({ where: { id } });
  }
}

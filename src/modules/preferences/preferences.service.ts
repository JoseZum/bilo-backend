import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertPreferenceDto } from './dto/upsert-preference.dto';
import { serializeJson } from '../../common/utils/db-json';

@Injectable()
export class PreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  getByUserId(userId: string) {
    return this.prisma.userPreference.findUnique({ where: { userId } });
  }

  async upsert(userId: string, dto: UpsertPreferenceDto) {
    if (
      dto.budgetMin !== undefined &&
      dto.budgetMax !== undefined &&
      dto.budgetMin > dto.budgetMax
    ) {
      throw new BadRequestException('budgetMin cannot be greater than budgetMax');
    }

    const data: Prisma.UserPreferenceUncheckedCreateInput = {
      userId,
      ...(dto.budgetMin !== undefined ? { budgetMin: dto.budgetMin } : {}),
      ...(dto.budgetMax !== undefined ? { budgetMax: dto.budgetMax } : {}),
      ...(dto.preferredZone !== undefined ? { preferredZone: dto.preferredZone } : {}),
      ...(dto.preferredCity !== undefined ? { preferredCity: dto.preferredCity } : {}),
      ...(dto.preferredLat !== undefined ? { preferredLat: dto.preferredLat } : {}),
      ...(dto.preferredLng !== undefined ? { preferredLng: dto.preferredLng } : {}),
      ...(dto.acceptsPets !== undefined ? { acceptsPets: dto.acceptsPets } : {}),
      ...(dto.needsParking !== undefined ? { needsParking: dto.needsParking } : {}),
      ...(dto.needsFurnished !== undefined ? { needsFurnished: dto.needsFurnished } : {}),
      ...(dto.wantsRoommate !== undefined ? { wantsRoommate: dto.wantsRoommate } : {}),
      ...(dto.minBedrooms !== undefined ? { minBedrooms: dto.minBedrooms } : {}),
      ...(dto.metadata !== undefined
        ? { metadata: serializeJson(dto.metadata) }
        : {}),
    };

    const updateData: Prisma.UserPreferenceUpdateInput = { ...data };
    delete (updateData as any).userId;

    return this.prisma.userPreference.upsert({
      where: { userId },
      create: data,
      update: updateData,
    });
  }
}

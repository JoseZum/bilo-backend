import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PropertyStatus } from '../../common/constants/domain-enums';
import { serializeJson } from '../../common/utils/db-json';
import { PrismaService } from '../../prisma/prisma.service';
import { AddImageDto } from './dto/add-image.dto';
import { CreatePropertyDto } from './dto/create-property.dto';
import { FilterPropertyDto } from './dto/filter-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(landlordId: string, dto: CreatePropertyDto) {
    const property = await this.prisma.property.create({
      data: {
        landlordId,
        title: dto.title,
        description: dto.description,
        type: dto.type ?? undefined,
        status: dto.status ?? PropertyStatus.ACTIVE,
        city: dto.city,
        zone: dto.zone ?? null,
        address: dto.address ?? null,
        lat: dto.lat ?? null,
        lng: dto.lng ?? null,
        monthlyPrice: dto.monthlyPrice,
        depositAmount: dto.depositAmount ?? 0,
        currency: dto.currency ?? 'USD',
        bedrooms: dto.bedrooms ?? 1,
        bathrooms: dto.bathrooms ?? 1,
        areaM2: dto.areaM2 ?? null,
        furnished: dto.furnished ?? false,
        petsAllowed: dto.petsAllowed ?? false,
        parking: dto.parking ?? false,
        roommateOk: dto.roommateOk ?? false,
        availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : null,
        metadata: serializeJson(dto.metadata),
        analytics: {
          create: {},
        },
      },
      include: { analytics: true, images: true },
    });

    this.eventEmitter.emit('property.created', {
      propertyId: property.id,
      landlordId: property.landlordId,
      actor: landlordId,
    });

    return property;
  }

  async update(propertyId: string, landlordId: string, dto: UpdatePropertyDto) {
    const existing = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Property not found');
    }
    if (existing.landlordId !== landlordId) {
      throw new ForbiddenException('You do not own this property');
    }

    const data: Prisma.PropertyUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.zone !== undefined) data.zone = dto.zone;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.lat !== undefined) data.lat = dto.lat;
    if (dto.lng !== undefined) data.lng = dto.lng;
    if (dto.monthlyPrice !== undefined) data.monthlyPrice = dto.monthlyPrice;
    if (dto.depositAmount !== undefined) data.depositAmount = dto.depositAmount;
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.bedrooms !== undefined) data.bedrooms = dto.bedrooms;
    if (dto.bathrooms !== undefined) data.bathrooms = dto.bathrooms;
    if (dto.areaM2 !== undefined) data.areaM2 = dto.areaM2;
    if (dto.furnished !== undefined) data.furnished = dto.furnished;
    if (dto.petsAllowed !== undefined) data.petsAllowed = dto.petsAllowed;
    if (dto.parking !== undefined) data.parking = dto.parking;
    if (dto.roommateOk !== undefined) data.roommateOk = dto.roommateOk;
    if (dto.availableFrom !== undefined) {
      data.availableFrom = dto.availableFrom ? new Date(dto.availableFrom) : null;
    }
    if (dto.metadata !== undefined) {
      data.metadata = serializeJson(dto.metadata);
    }

    const updated = await this.prisma.property.update({
      where: { id: propertyId },
      data,
      include: { analytics: true, images: true },
    });

    this.eventEmitter.emit('property.updated', {
      propertyId: updated.id,
      landlordId: updated.landlordId,
      actor: landlordId,
    });

    return updated;
  }

  async softDelete(propertyId: string, landlordId: string) {
    const existing = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Property not found');
    }
    if (existing.landlordId !== landlordId) {
      throw new ForbiddenException('You do not own this property');
    }

    const deleted = await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        deletedAt: new Date(),
        status: PropertyStatus.ARCHIVED,
      },
    });

    this.eventEmitter.emit('property.deleted', {
      propertyId: deleted.id,
      landlordId: deleted.landlordId,
      actor: landlordId,
    });

    return { id: deleted.id, deletedAt: deleted.deletedAt, status: deleted.status };
  }

  async findById(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        images: { orderBy: { position: 'asc' } },
        analytics: true,
        landlord: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            role: true,
            verificationStatus: true,
            trustScore: true,
            bio: true,
            createdAt: true,
          },
        },
      },
    });
    if (!property || property.deletedAt) {
      throw new NotFoundException('Property not found');
    }
    return property;
  }

  findActiveList(filter: FilterPropertyDto) {
    const where: Prisma.PropertyWhereInput = {
      status: PropertyStatus.ACTIVE,
      deletedAt: null,
    };

    if (filter.city) {
      where.city = { contains: filter.city };
    }
    if (filter.zone) {
      where.zone = { contains: filter.zone };
    }
    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      where.monthlyPrice = {};
      if (filter.minPrice !== undefined) {
        (where.monthlyPrice as Prisma.IntFilter).gte = filter.minPrice;
      }
      if (filter.maxPrice !== undefined) {
        (where.monthlyPrice as Prisma.IntFilter).lte = filter.maxPrice;
      }
    }
    if (filter.bedrooms !== undefined) {
      where.bedrooms = { gte: filter.bedrooms };
    }
    if (filter.petsAllowed !== undefined) {
      where.petsAllowed = filter.petsAllowed;
    }
    if (filter.parking !== undefined) {
      where.parking = filter.parking;
    }
    if (filter.furnished !== undefined) {
      where.furnished = filter.furnished;
    }

    const take = filter.take ?? 20;
    const skip = filter.skip ?? 0;

    return this.prisma.property.findMany({
      where,
      take,
      skip,
      orderBy: [{ createdAt: 'desc' }],
      include: {
        images: { orderBy: { position: 'asc' }, take: 5 },
        analytics: true,
      },
    });
  }

  findByLandlord(landlordId: string) {
    return this.prisma.property.findMany({
      where: { landlordId },
      orderBy: [{ createdAt: 'desc' }],
      include: {
        images: { orderBy: { position: 'asc' } },
        analytics: true,
      },
    });
  }

  async addImage(
    propertyId: string,
    landlordId: string,
    dto: AddImageDto,
  ) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property || property.deletedAt) {
      throw new NotFoundException('Property not found');
    }
    if (property.landlordId !== landlordId) {
      throw new ForbiddenException('You do not own this property');
    }

    return this.prisma.propertyImage.create({
      data: {
        propertyId,
        url: dto.url,
        position: dto.position ?? 0,
      },
    });
  }

  async removeImage(imageId: string, landlordId: string) {
    const image = await this.prisma.propertyImage.findUnique({
      where: { id: imageId },
      include: { property: true },
    });
    if (!image) throw new NotFoundException('Image not found');
    if (image.property.landlordId !== landlordId) {
      throw new ForbiddenException('You do not own this property');
    }

    await this.prisma.propertyImage.delete({ where: { id: imageId } });
    return { id: imageId, deleted: true };
  }

  async incrementView(propertyId: string) {
    return this.prisma.propertyAnalytics.upsert({
      where: { propertyId },
      create: { propertyId, viewCount: 1 },
      update: { viewCount: { increment: 1 } },
    });
  }

  async incrementLike(propertyId: string) {
    return this.prisma.propertyAnalytics.upsert({
      where: { propertyId },
      create: { propertyId, likeCount: 1 },
      update: { likeCount: { increment: 1 } },
    });
  }

  async incrementMatch(propertyId: string) {
    return this.prisma.propertyAnalytics.upsert({
      where: { propertyId },
      create: { propertyId, matchCount: 1 },
      update: { matchCount: { increment: 1 } },
    });
  }

  async getAnalytics(propertyId: string, requesterId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: { analytics: true },
    });
    if (!property || property.deletedAt) {
      throw new NotFoundException('Property not found');
    }
    if (property.landlordId !== requesterId) {
      throw new ForbiddenException('Only the landlord can view analytics');
    }
    if (!property.analytics) {
      return this.prisma.propertyAnalytics.create({
        data: { propertyId },
      });
    }
    return property.analytics;
  }
}

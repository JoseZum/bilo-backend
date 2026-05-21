import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { ServiceRequestStatus, UserRole } from '../../common/constants/domain-enums';
import { serializeJson } from '../../common/utils/db-json';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePropertyServiceDto } from './dto/create-property-service.dto';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateServiceRequestDto } from './dto/update-service-request.dto';

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createPropertyService(
    landlordId: string,
    propertyId: string,
    dto: CreatePropertyServiceDto,
  ) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, landlordId: true },
    });
    if (!property) throw new NotFoundException('Property not found');
    if (property.landlordId !== landlordId) {
      throw new ForbiddenException('Only the landlord can manage property services');
    }

    if (dto.serviceProviderId) {
      const provider = await this.prisma.serviceProvider.findUnique({
        where: { id: dto.serviceProviderId },
        select: { id: true },
      });
      if (!provider) throw new NotFoundException('Service provider not found');
    }

    return this.prisma.propertyService.create({
      data: {
        propertyId,
        type: dto.type,
        serviceProviderId: dto.serviceProviderId ?? null,
        metadata: serializeJson(dto.metadata),
      },
    });
  }

  async listPropertyServices(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true },
    });
    if (!property) throw new NotFoundException('Property not found');

    return this.prisma.propertyService.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
      include: { serviceProvider: true },
    });
  }

  async createServiceRequest(userId: string, dto: CreateServiceRequestDto) {
    const propertyService = await this.prisma.propertyService.findUnique({
      where: { id: dto.propertyServiceId },
      select: {
        id: true,
        propertyId: true,
        serviceProviderId: true,
        active: true,
      },
    });
    if (!propertyService) throw new NotFoundException('Property service not found');
    if (!propertyService.active) {
      throw new BadRequestException('Property service is not active');
    }

    if (dto.leaseId) {
      const lease = await this.prisma.lease.findUnique({
        where: { id: dto.leaseId },
        select: { id: true, propertyId: true },
      });
      if (!lease) throw new NotFoundException('Lease not found');
      if (lease.propertyId !== propertyService.propertyId) {
        throw new BadRequestException('Lease does not match property of service');
      }
    }

    const request = await this.prisma.serviceRequest.create({
      data: {
        propertyServiceId: dto.propertyServiceId,
        leaseId: dto.leaseId ?? null,
        requesterId: userId,
        serviceProviderId: propertyService.serviceProviderId ?? null,
        type: dto.type,
        status: ServiceRequestStatus.PENDING,
        title: dto.title,
        description: dto.description ?? null,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      },
    });

    this.eventEmitter.emit('service.request_created', {
      requestId: request.id,
      requesterId: userId,
      propertyServiceId: dto.propertyServiceId,
      type: dto.type,
    });

    return request;
  }

  async updateServiceRequest(
    requestId: string,
    actorId: string,
    actorRole: UserRole,
    dto: UpdateServiceRequestDto,
  ) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: {
        propertyService: {
          select: {
            propertyId: true,
            property: { select: { landlordId: true } },
          },
        },
      },
    });
    if (!request) throw new NotFoundException('Service request not found');

    const isRequester = request.requesterId === actorId;
    const isLandlord =
      request.propertyService?.property?.landlordId === actorId;
    const isAdmin = actorRole === UserRole.ADMIN;

    if (!isRequester && !isLandlord && !isAdmin) {
      throw new ForbiddenException('Not allowed to update this service request');
    }

    const data: Prisma.ServiceRequestUpdateInput = {};
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.scheduledAt !== undefined) {
      data.scheduledAt = new Date(dto.scheduledAt);
    }
    if (dto.status === ServiceRequestStatus.COMPLETED) {
      data.completedAt = new Date();
    } else if (dto.completedAt !== undefined) {
      data.completedAt = new Date(dto.completedAt);
    }

    const updated = await this.prisma.serviceRequest.update({
      where: { id: requestId },
      data,
    });

    this.eventEmitter.emit('service.updated', {
      requestId,
      actorId,
      status: updated.status,
    });

    return updated;
  }

  listServiceRequests(userId: string) {
    return this.prisma.serviceRequest.findMany({
      where: {
        OR: [
          { requesterId: userId },
          { propertyService: { property: { landlordId: userId } } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        propertyService: {
          include: {
            property: { select: { id: true, title: true, landlordId: true } },
          },
        },
      },
    });
  }
}

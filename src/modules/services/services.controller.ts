import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '../../common/constants/domain-enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../common/types/auth-user';
import { CreatePropertyServiceDto } from './dto/create-property-service.dto';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateServiceRequestDto } from './dto/update-service-request.dto';
import { ServicesService } from './services.service';

@ApiTags('services')
@ApiBearerAuth()
@Controller()
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post('properties/:propertyId/services')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  @ApiOperation({ summary: '[LANDLORD] Attach a service to a property' })
  @ApiParam({ name: 'propertyId', description: 'Property UUID' })
  createPropertyService(
    @Param('propertyId', new ParseUUIDPipe()) propertyId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePropertyServiceDto,
  ) {
    return this.servicesService.createPropertyService(user.id, propertyId, dto);
  }

  @Get('properties/:propertyId/services')
  @ApiOperation({ summary: 'List services attached to a property' })
  @ApiParam({ name: 'propertyId', description: 'Property UUID' })
  listPropertyServices(
    @Param('propertyId', new ParseUUIDPipe()) propertyId: string,
  ) {
    return this.servicesService.listPropertyServices(propertyId);
  }

  @Post('service-requests')
  @ApiOperation({ summary: 'Create a service request' })
  createServiceRequest(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateServiceRequestDto,
  ) {
    return this.servicesService.createServiceRequest(user.id, dto);
  }

  @Get('service-requests')
  @ApiOperation({ summary: 'List service requests for current user (as requester or landlord)' })
  listServiceRequests(@CurrentUser() user: AuthUser) {
    return this.servicesService.listServiceRequests(user.id);
  }

  @Patch('service-requests/:id')
  @ApiOperation({ summary: 'Update a service request (requester, landlord, or admin)' })
  @ApiParam({ name: 'id', description: 'ServiceRequest UUID' })
  updateServiceRequest(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateServiceRequestDto,
  ) {
    return this.servicesService.updateServiceRequest(id, user.id, user.role, dto);
  }
}

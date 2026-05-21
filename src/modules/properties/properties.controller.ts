import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
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
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../common/types/auth-user';
import { AddImageDto } from './dto/add-image.dto';
import { CreatePropertyDto } from './dto/create-property.dto';
import { FilterPropertyDto } from './dto/filter-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertiesService } from './properties.service';

@ApiTags('properties')
@ApiBearerAuth()
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD)
  @ApiOperation({ summary: 'Create a new property (LANDLORD only)' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(user.id, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Public list of active properties with filters' })
  findActiveList(@Query() filter: FilterPropertyDto) {
    return this.propertiesService.findActiveList(filter);
  }

  @Get('me/list')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD)
  @ApiOperation({ summary: 'List properties owned by current landlord' })
  findMine(@CurrentUser() user: AuthUser) {
    return this.propertiesService.findByLandlord(user.id);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Public detail of a single property' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  async findById(@Param('id', new ParseUUIDPipe()) id: string) {
    const property = await this.propertiesService.findById(id);
    // Fire-and-forget view increment
    this.propertiesService.incrementView(id).catch(() => undefined);
    return property;
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD)
  @ApiOperation({ summary: 'Update a property (owner only)' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD)
  @ApiOperation({ summary: 'Soft-delete a property (owner only)' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  softDelete(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.propertiesService.softDelete(id, user.id);
  }

  @Post(':id/images')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD)
  @ApiOperation({ summary: 'Add image to a property (owner only)' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  addImage(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddImageDto,
  ) {
    return this.propertiesService.addImage(id, user.id, dto);
  }

  @Delete(':id/images/:imageId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD)
  @ApiOperation({ summary: 'Remove image from a property (owner only)' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  @ApiParam({ name: 'imageId', description: 'PropertyImage UUID' })
  removeImage(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) _id: string,
    @Param('imageId', new ParseUUIDPipe()) imageId: string,
  ) {
    return this.propertiesService.removeImage(imageId, user.id);
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get analytics for a property (owner only)' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  getAnalytics(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.propertiesService.getAnalytics(id, user.id);
  }
}

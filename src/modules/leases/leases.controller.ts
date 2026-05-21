import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '../../common/constants/domain-enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../common/types/auth-user';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { UpdateLeaseStatusDto } from './dto/update-lease-status.dto';
import { LeasesService } from './leases.service';

@ApiTags('leases')
@ApiBearerAuth()
@Controller('leases')
export class LeasesController {
  constructor(private readonly leasesService: LeasesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD)
  @ApiOperation({ summary: 'Create a lease (landlord only)' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateLeaseDto) {
    return this.leasesService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List leases for the current user' })
  findForUser(@CurrentUser() user: AuthUser) {
    return this.leasesService.findForUser(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a lease by id' })
  findById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.leasesService.findById(id, user.id);
  }

  @Post(':id/status')
  @ApiOperation({ summary: 'Update lease status' })
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateLeaseStatusDto,
  ) {
    return this.leasesService.updateStatus(id, user.id, dto.status);
  }
}

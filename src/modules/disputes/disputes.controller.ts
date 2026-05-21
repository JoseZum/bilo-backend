import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { DisputesService } from './disputes.service';
import { AddEvidenceDto } from './dto/add-evidence.dto';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeDto } from './dto/update-dispute.dto';

@ApiTags('disputes')
@ApiBearerAuth()
@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  @ApiOperation({ summary: 'Open a new dispute' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateDisputeDto) {
    return this.disputesService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List disputes where current user is opener or against' })
  list(@CurrentUser() user: AuthUser) {
    return this.disputesService.listForUser(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a dispute (only parties or admin)' })
  @ApiParam({ name: 'id', description: 'Dispute UUID' })
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.disputesService.findById(id, user.id, user.role);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update dispute (opener: CANCEL only; admin: UNDER_REVIEW/RESOLVED/REJECTED)',
  })
  @ApiParam({ name: 'id', description: 'Dispute UUID' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateDisputeDto,
  ) {
    return this.disputesService.update(id, user.id, user.role, dto);
  }

  @Post(':id/evidence')
  @ApiOperation({ summary: 'Attach evidence to a dispute (opener or against)' })
  @ApiParam({ name: 'id', description: 'Dispute UUID' })
  addEvidence(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: AddEvidenceDto,
  ) {
    return this.disputesService.addEvidence(id, user.id, dto);
  }
}

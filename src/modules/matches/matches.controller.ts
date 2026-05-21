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
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '../../common/constants/domain-enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../common/types/auth-user';
import { CreateMatchDto } from './dto/create-match.dto';
import { RespondMatchDto } from './dto/respond-match.dto';
import { MatchesService } from './matches.service';

@ApiTags('matches')
@ApiBearerAuth()
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TENANT)
  @ApiOperation({ summary: 'Create a match request (TENANT only)' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMatchDto) {
    return this.matchesService.create(user.id, dto.propertyId);
  }

  @Post(':id/respond')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD)
  @ApiOperation({ summary: 'Accept or reject a pending match (LANDLORD only)' })
  @ApiParam({ name: 'id', description: 'Match UUID' })
  respond(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RespondMatchDto,
  ) {
    return this.matchesService.respond(id, user.id, dto.action);
  }

  @Get()
  @ApiOperation({ summary: 'List matches for current user' })
  findForUser(@CurrentUser() user: AuthUser) {
    return this.matchesService.findForUser(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific match by id' })
  @ApiParam({ name: 'id', description: 'Match UUID' })
  findById(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.matchesService.findById(id, user.id);
  }
}

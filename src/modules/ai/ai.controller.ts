import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../../common/constants/domain-enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../common/types/auth-user';
import { AIService } from './ai.service';
import { AskDto } from './dto/ask.dto';
import { UpsertContextDto } from './dto/upsert-context.dto';

@ApiTags('ai')
@ApiBearerAuth()
@Controller()
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('ai/property/:propertyId/ask')
  @ApiOperation({ summary: 'Ask the AI a question about a property' })
  @ApiParam({ name: 'propertyId', description: 'Property UUID' })
  askProperty(
    @CurrentUser() user: AuthUser,
    @Param('propertyId', new ParseUUIDPipe()) propertyId: string,
    @Body() dto: AskDto,
  ) {
    return this.aiService.askProperty(user.id, propertyId, dto);
  }

  @Post('ai/lease/:leaseId/ask')
  @ApiOperation({ summary: 'Ask the AI a question about a lease' })
  @ApiParam({ name: 'leaseId', description: 'Lease UUID' })
  askLease(
    @CurrentUser() user: AuthUser,
    @Param('leaseId', new ParseUUIDPipe()) leaseId: string,
    @Body() dto: AskDto,
  ) {
    return this.aiService.askLease(user.id, leaseId, dto);
  }

  @Post('properties/:propertyId/ai-context')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD)
  @ApiOperation({
    summary: 'Create or update the AI context for a property (LANDLORD only)',
  })
  @ApiParam({ name: 'propertyId', description: 'Property UUID' })
  upsertPropertyContext(
    @CurrentUser() user: AuthUser,
    @Param('propertyId', new ParseUUIDPipe()) propertyId: string,
    @Body() dto: UpsertContextDto,
  ) {
    return this.aiService.upsertPropertyContext(user.id, propertyId, dto);
  }

  @Get('properties/:propertyId/ai-context')
  @ApiOperation({ summary: 'Get the AI context for a property' })
  @ApiParam({ name: 'propertyId', description: 'Property UUID' })
  getPropertyContext(
    @Param('propertyId', new ParseUUIDPipe()) propertyId: string,
  ) {
    return this.aiService.getPropertyContext(propertyId);
  }
}

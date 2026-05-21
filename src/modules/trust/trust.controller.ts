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
import { RecordEventDto } from './dto/record-event.dto';
import { TrustService } from './trust.service';

@ApiTags('trust')
@ApiBearerAuth()
@Controller('trust')
export class TrustController {
  constructor(private readonly trustService: TrustService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user trust score and recent history' })
  async getMe(@CurrentUser() user: AuthUser) {
    const score = await this.trustService.getScore(user.id);
    const history = await this.trustService.getHistory(user.id);
    return { ...score, history: history.history, recentEvents: history.recentEvents };
  }

  @Get(':userId/score')
  @ApiOperation({ summary: 'Get trust score of a user' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  getScore(@Param('userId', new ParseUUIDPipe()) userId: string) {
    return this.trustService.getScore(userId);
  }

  @Get(':userId/history')
  @ApiOperation({ summary: 'Get trust score history of a user' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  getHistory(@Param('userId', new ParseUUIDPipe()) userId: string) {
    return this.trustService.getHistory(userId);
  }

  @Post('events')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Manually record a trust event (testing / manual)' })
  recordEvent(@Body() dto: RecordEventDto) {
    return this.trustService.recordEvent({
      userId: dto.userId,
      type: dto.type,
      delta: dto.delta,
      reason: dto.reason,
      metadata: dto.metadata,
    });
  }
}

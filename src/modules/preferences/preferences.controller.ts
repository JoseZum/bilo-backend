import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { UpsertPreferenceDto } from './dto/upsert-preference.dto';
import { PreferencesService } from './preferences.service';

@ApiTags('preferences')
@ApiBearerAuth()
@Controller('preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user preferences' })
  getMine(@CurrentUser() user: AuthUser) {
    return this.preferencesService.getByUserId(user.id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Create or update current user preferences' })
  upsertMine(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpsertPreferenceDto,
  ) {
    return this.preferencesService.upsert(user.id, dto);
  }
}

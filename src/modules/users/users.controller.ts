import {
  Body,
  Controller,
  Get,
  NotFoundException,
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
import { ChangeRoleDto } from './dto/change-role.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user profile with preferences' })
  async getMe(@CurrentUser() user: AuthUser) {
    const profile = await this.usersService.findByIdWithPreferences(user.id);
    if (!profile) throw new NotFoundException('User not found');
    return profile;
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  updateMe(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Post('me/role')
  @ApiOperation({
    summary: 'Change current user role (TENANT <-> LANDLORD)',
  })
  changeRole(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangeRoleDto,
  ) {
    return this.usersService.changeRole(user.id, dto.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get public profile of a user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.usersService.getPublicProfile(id);
  }

  @Get(':id/trust-score')
  @ApiOperation({ summary: 'Get trust score of a user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  getTrustScore(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.usersService.getTrustScore(id);
  }
}

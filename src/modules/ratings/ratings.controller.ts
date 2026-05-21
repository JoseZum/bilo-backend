import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
import { CreateRatingDto } from './dto/create-rating.dto';
import { RatingsService } from './ratings.service';

@ApiTags('ratings')
@ApiBearerAuth()
@Controller()
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post('leases/:leaseId/ratings')
  @ApiOperation({ summary: 'Create a rating for a counterparty in a lease' })
  @ApiParam({ name: 'leaseId', description: 'Lease UUID' })
  create(
    @Param('leaseId', new ParseUUIDPipe()) leaseId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateRatingDto,
  ) {
    return this.ratingsService.create(leaseId, user.id, dto);
  }

  @Get('users/:id/ratings')
  @ApiOperation({ summary: 'List ratings received by a user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  list(@Param('id', new ParseUUIDPipe()) userId: string) {
    return this.ratingsService.listForUser(userId);
  }
}

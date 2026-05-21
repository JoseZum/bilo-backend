import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { CreateSwipeDto } from './dto/create-swipe.dto';
import { SwipesService } from './swipes.service';

class HistoryQueryDto {
  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  take?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;
}

@ApiTags('swipes')
@ApiBearerAuth()
@Controller('swipes')
export class SwipesController {
  constructor(private readonly swipesService: SwipesService) {}

  @Post()
  @ApiOperation({ summary: 'Register a swipe (LIKE / DISLIKE / SUPERLIKE)' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSwipeDto) {
    return this.swipesService.create(user.id, dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get current user swipe history' })
  history(@CurrentUser() user: AuthUser, @Query() query: HistoryQueryDto) {
    return this.swipesService.history(user.id, {
      take: query.take,
      skip: query.skip,
    });
  }
}

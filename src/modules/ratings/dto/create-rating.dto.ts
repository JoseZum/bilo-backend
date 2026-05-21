import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRatingDto {
  @ApiProperty({ description: 'User receiving the rating (counterparty in the lease)' })
  @IsUUID()
  toUserId!: string;

  @ApiProperty({ description: 'Score from 1 to 5', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  score!: number;

  @ApiPropertyOptional({ description: 'Optional free-text comment' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}

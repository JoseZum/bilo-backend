import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpsertPreferenceDto {
  @ApiPropertyOptional({ description: 'Minimum monthly budget', example: 300 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  budgetMin?: number;

  @ApiPropertyOptional({ description: 'Maximum monthly budget', example: 1200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  budgetMax?: number;

  @ApiPropertyOptional({ description: 'Preferred zone or neighborhood', example: 'Pocitos' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  preferredZone?: string;

  @ApiPropertyOptional({ description: 'Preferred city', example: 'Montevideo' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  preferredCity?: string;

  @ApiPropertyOptional({ description: 'Preferred latitude', example: -34.9011 })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  preferredLat?: number;

  @ApiPropertyOptional({ description: 'Preferred longitude', example: -56.1645 })
  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  preferredLng?: number;

  @ApiPropertyOptional({ description: 'Accepts pets', example: true })
  @IsOptional()
  @IsBoolean()
  acceptsPets?: boolean;

  @ApiPropertyOptional({ description: 'Needs parking', example: false })
  @IsOptional()
  @IsBoolean()
  needsParking?: boolean;

  @ApiPropertyOptional({ description: 'Needs furnished property', example: true })
  @IsOptional()
  @IsBoolean()
  needsFurnished?: boolean;

  @ApiPropertyOptional({ description: 'Open to roommates', example: false })
  @IsOptional()
  @IsBoolean()
  wantsRoommate?: boolean;

  @ApiPropertyOptional({ description: 'Minimum number of bedrooms', example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minBedrooms?: number;

  @ApiPropertyOptional({ description: 'Arbitrary metadata (JSON)', type: Object })
  @IsOptional()
  metadata?: Record<string, any>;
}

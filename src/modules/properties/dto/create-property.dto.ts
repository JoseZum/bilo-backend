import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyStatus, PropertyType } from '../../../common/constants/domain-enums';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreatePropertyDto {
  @ApiProperty({ example: 'Cozy studio in downtown' })
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title!: string;

  @ApiProperty({ example: 'A beautiful studio with great views...' })
  @IsString()
  @MinLength(10)
  description!: string;

  @ApiPropertyOptional({ enum: PropertyType, default: PropertyType.APARTMENT })
  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @ApiPropertyOptional({ enum: PropertyStatus, default: PropertyStatus.ACTIVE })
  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @ApiProperty({ example: 'Bogota' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  city!: string;

  @ApiPropertyOptional({ example: 'Chapinero' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  zone?: string;

  @ApiPropertyOptional({ example: 'Cra 7 # 70-12' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ example: 4.6097 })
  @IsOptional()
  @Type(() => Number)
  lat?: number;

  @ApiPropertyOptional({ example: -74.0817 })
  @IsOptional()
  @Type(() => Number)
  lng?: number;

  @ApiProperty({ example: 1200000, description: 'Monthly price in minor units of currency' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  monthlyPrice!: number;

  @ApiPropertyOptional({ example: 1200000, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  depositAmount?: number;

  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @ApiPropertyOptional({ example: 2, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  bedrooms?: number;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  bathrooms?: number;

  @ApiPropertyOptional({ example: 65 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  areaM2?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  furnished?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  petsAllowed?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  parking?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  roommateOk?: boolean;

  @ApiPropertyOptional({ example: '2026-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  availableFrom?: string;

  @ApiPropertyOptional({ description: 'Free-form metadata for the property' })
  @IsOptional()
  metadata?: Record<string, any>;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType } from '../../../common/constants/domain-enums';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateServiceRequestDto {
  @ApiProperty({ description: 'Property service UUID' })
  @IsUUID()
  propertyServiceId!: string;

  @ApiPropertyOptional({ description: 'Optional related lease UUID' })
  @IsOptional()
  @IsUUID()
  leaseId?: string;

  @ApiProperty({ enum: ServiceType })
  @IsEnum(ServiceType)
  type!: ServiceType;

  @ApiProperty({ description: 'Short title for the request' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ description: 'Full description' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional({ description: 'ISO-8601 scheduled date-time' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

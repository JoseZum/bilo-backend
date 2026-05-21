import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType } from '../../../common/constants/domain-enums';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class CreatePropertyServiceDto {
  @ApiProperty({ enum: ServiceType })
  @IsEnum(ServiceType)
  type!: ServiceType;

  @ApiPropertyOptional({ description: 'Service provider UUID (optional)' })
  @IsOptional()
  @IsUUID()
  serviceProviderId?: string;

  @ApiPropertyOptional({ description: 'Arbitrary metadata', type: Object })
  @IsOptional()
  metadata?: Record<string, any>;
}

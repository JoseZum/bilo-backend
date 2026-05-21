import { ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceRequestStatus } from '../../../common/constants/domain-enums';
import {
  IsDateString,
  IsEnum,
  IsOptional,
} from 'class-validator';

export class UpdateServiceRequestDto {
  @ApiPropertyOptional({ enum: ServiceRequestStatus })
  @IsOptional()
  @IsEnum(ServiceRequestStatus)
  status?: ServiceRequestStatus;

  @ApiPropertyOptional({ description: 'ISO-8601 scheduled date-time' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ description: 'ISO-8601 completion date-time' })
  @IsOptional()
  @IsDateString()
  completedAt?: string;
}

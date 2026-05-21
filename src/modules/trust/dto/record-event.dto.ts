import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TrustEventType } from '../../../common/constants/domain-enums';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class RecordEventDto {
  @ApiProperty({ description: 'Target user UUID' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ enum: TrustEventType })
  @IsEnum(TrustEventType)
  type!: TrustEventType;

  @ApiPropertyOptional({
    description: 'Override delta. If omitted, derived from rules for type.',
    minimum: -100,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(-100)
  @Max(100)
  delta?: number;

  @ApiPropertyOptional({ description: 'Short reason / context label' })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  reason?: string;

  @ApiPropertyOptional({ description: 'Arbitrary metadata (JSON)', type: Object })
  @IsOptional()
  metadata?: Record<string, any>;
}

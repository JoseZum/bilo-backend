import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DisputeEvidenceType } from '../../../common/constants/domain-enums';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class AddEvidenceDto {
  @ApiProperty({ enum: DisputeEvidenceType })
  @IsEnum(DisputeEvidenceType)
  type!: DisputeEvidenceType;

  @ApiPropertyOptional({ description: 'URL to evidence (photo/document)' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  url?: string;

  @ApiPropertyOptional({ description: 'Free-text note describing the evidence' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

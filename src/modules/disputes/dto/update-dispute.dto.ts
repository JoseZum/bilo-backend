import { ApiPropertyOptional } from '@nestjs/swagger';
import { DisputeStatus } from '../../../common/constants/domain-enums';
import {
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export type ResolvedInFavorOf = 'opener' | 'against';

export class UpdateDisputeDto {
  @ApiPropertyOptional({ enum: DisputeStatus })
  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;

  @ApiPropertyOptional({ description: 'Resolution summary' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  resolution?: string;

  @ApiPropertyOptional({
    description:
      "Required when status=RESOLVED. Determines trust impact direction.",
    enum: ['opener', 'against'],
  })
  @IsOptional()
  @IsIn(['opener', 'against'])
  resolvedInFavorOf?: ResolvedInFavorOf;
}

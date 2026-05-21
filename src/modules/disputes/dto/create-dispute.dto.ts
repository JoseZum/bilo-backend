import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DisputeType } from '../../../common/constants/domain-enums';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateDisputeDto {
  @ApiPropertyOptional({ description: 'Optional related lease UUID' })
  @IsOptional()
  @IsUUID()
  leaseId?: string;

  @ApiProperty({ description: 'User against whom the dispute is opened' })
  @IsUUID()
  againstId!: string;

  @ApiProperty({ enum: DisputeType })
  @IsEnum(DisputeType)
  type!: DisputeType;

  @ApiProperty({ description: 'Short title for the dispute' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @ApiProperty({ description: 'Full description of the dispute' })
  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  description!: string;
}

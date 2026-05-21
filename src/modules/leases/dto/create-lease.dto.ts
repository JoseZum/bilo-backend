import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreateLeaseDto {
  @ApiProperty()
  @IsUUID()
  matchId!: string;

  @ApiProperty({ description: 'Monthly rent amount (minor units / integer)' })
  @IsInt()
  @Min(0)
  monthlyAmount!: number;

  @ApiProperty({ description: 'Security deposit amount' })
  @IsInt()
  @Min(0)
  depositAmount!: number;

  @ApiPropertyOptional({ default: 'USD' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({ description: 'Day of month rent is due', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(28)
  dueDay?: number;

  @ApiProperty({ type: String, format: 'date-time' })
  @Type(() => Date)
  @IsDate()
  startDate!: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Optional schedule metadata' })
  @IsOptional()
  @IsObject()
  schedule?: Record<string, any>;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUrl, Min } from 'class-validator';

export class AddImageDto {
  @ApiProperty({ example: 'https://cdn.bilo.com/images/property-1.jpg' })
  @IsString()
  @IsUrl({ require_tld: false })
  url!: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  position?: number;
}

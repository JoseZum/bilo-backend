import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'Full name of the user', example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @ApiPropertyOptional({ description: 'Avatar URL', example: 'https://cdn.bilo.app/u/123.jpg' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+59899123456' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @ApiPropertyOptional({ description: 'Short biography' })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  bio?: string;

  @ApiPropertyOptional({ description: 'Arbitrary metadata (JSON)', type: Object })
  @IsOptional()
  metadata?: Record<string, any>;
}

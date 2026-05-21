import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'User email', example: 'user@bilo.app' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ description: 'User password (optional in MVP)' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}

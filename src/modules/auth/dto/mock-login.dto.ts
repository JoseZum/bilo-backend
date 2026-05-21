import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../common/constants/domain-enums';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class MockLoginDto {
  @ApiProperty({ description: 'User email', example: 'demo@bilo.app' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({
    enum: UserRole,
    description: 'Optional role to assign on creation',
    example: UserRole.TENANT,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Full name used when creating a new user', example: 'Demo User' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;
}

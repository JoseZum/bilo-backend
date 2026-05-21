import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../common/constants/domain-enums';
import { IsEnum, IsIn } from 'class-validator';

export class ChangeRoleDto {
  @ApiProperty({
    enum: [UserRole.TENANT, UserRole.LANDLORD],
    description: 'New role for the user. ADMIN cannot be assigned via this endpoint.',
    example: UserRole.LANDLORD,
  })
  @IsEnum(UserRole)
  @IsIn([UserRole.TENANT, UserRole.LANDLORD])
  role!: UserRole;
}

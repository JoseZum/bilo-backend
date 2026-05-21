import { ApiProperty } from '@nestjs/swagger';
import { LeaseStatus } from '../../../common/constants/domain-enums';
import { IsEnum } from 'class-validator';

export class UpdateLeaseStatusDto {
  @ApiProperty({ enum: LeaseStatus })
  @IsEnum(LeaseStatus)
  status!: LeaseStatus;
}

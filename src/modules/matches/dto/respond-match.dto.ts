import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export type RespondMatchAction = 'accept' | 'reject';

export class RespondMatchDto {
  @ApiProperty({ enum: ['accept', 'reject'], example: 'accept' })
  @IsIn(['accept', 'reject'])
  action!: RespondMatchAction;
}

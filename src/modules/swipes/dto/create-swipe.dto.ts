import { ApiProperty } from '@nestjs/swagger';
import { SwipeAction } from '../../../common/constants/domain-enums';
import { IsEnum, IsUUID } from 'class-validator';

export class CreateSwipeDto {
  @ApiProperty({ example: '7e1b6e8e-2c0a-4a3e-9a5b-b5d6f9b1c2d3' })
  @IsUUID()
  propertyId!: string;

  @ApiProperty({ enum: SwipeAction, example: SwipeAction.LIKE })
  @IsEnum(SwipeAction)
  action!: SwipeAction;
}

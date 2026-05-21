import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '../../../common/constants/domain-enums';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ description: 'Message content', example: 'Hi, when can I visit?' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;

  @ApiPropertyOptional({ enum: MessageType, default: MessageType.TEXT })
  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType;
}

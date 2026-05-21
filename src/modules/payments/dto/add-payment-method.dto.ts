import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethodType } from '../../../common/constants/domain-enums';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class AddPaymentMethodDto {
  @ApiProperty({ enum: PaymentMethodType })
  @IsEnum(PaymentMethodType)
  type!: PaymentMethodType;

  @ApiPropertyOptional({ example: 'Visa' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  brand?: string;

  @ApiPropertyOptional({ example: '4242' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2,4}$/)
  last4?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

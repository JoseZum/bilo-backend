import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class PayDto {
  @ApiPropertyOptional({
    description: 'PaymentMethod id to use. If omitted, uses default.',
  })
  @IsOptional()
  @IsUUID()
  paymentMethodId?: string;

  @ApiPropertyOptional({
    description: 'Method type override (e.g. "card", "fail_card" for tests)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  methodType?: string;
}

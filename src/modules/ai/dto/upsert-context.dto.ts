import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpsertContextDto {
  @ApiProperty({
    description: 'Context text used by AI to answer questions about the property',
    example:
      'Es un departamento amueblado, acepta mascotas pequeñas, sin parqueo. El acceso es por la avenida principal.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  context!: string;

  @ApiPropertyOptional({ description: 'Arbitrary metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

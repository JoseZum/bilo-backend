import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class AskDto {
  @ApiProperty({
    description: 'Question to ask the AI about the property or lease',
    example: '¿Esta propiedad acepta mascotas?',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  question!: string;
}

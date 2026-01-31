import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, MaxLength, Min } from 'class-validator';

export class CreatePositionRequestDto {
  @ApiProperty({
    example: 'Senior Software Engineer',
    description: 'Name of the position',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 5,
    description: 'Level of the position (higher number = higher level)',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  level: number;
}

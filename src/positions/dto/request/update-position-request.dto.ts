import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, MaxLength, Min } from 'class-validator';

export class UpdatePositionRequestDto {
  @ApiProperty({
    example: 'Senior Software Engineer',
    description: 'Name of the position',
    maxLength: 100,
    required: false,
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 5,
    description: 'Level of the position (higher number = higher level)',
    minimum: 1,
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  level?: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateDepartmentRequestDto {
  @ApiProperty({
    example: 'Engineering',
    description: 'Name of the department',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'Engineering department responsible for product development',
    description: 'Description of the department',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}

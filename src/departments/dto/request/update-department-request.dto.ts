import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateDepartmentRequestDto {
  @ApiProperty({
    example: 'Engineering',
    description: 'Name of the department',
    maxLength: 100,
    required: false,
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'Engineering department responsible for product development',
    description: 'Description of the department',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DepartmentResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'Engineering' })
  name: string;

  @ApiPropertyOptional({
    example: 'Engineering department responsible for product development',
  })
  description?: string;
}

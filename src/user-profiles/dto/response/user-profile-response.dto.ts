import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class DepartmentDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'Engineering' })
  name: string;

  @ApiPropertyOptional({ example: 'Engineering department' })
  description?: string;
}

class PositionDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'Senior Software Engineer' })
  name: string;

  @ApiProperty({ example: 5 })
  level: number;
}

export class UserProfileResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  userId: string;

  @ApiPropertyOptional({ type: DepartmentDto })
  department?: DepartmentDto;

  @ApiPropertyOptional({ type: PositionDto })
  position?: PositionDto;

  @ApiPropertyOptional({ example: '2024-01-15' })
  joinedAt?: Date;
}

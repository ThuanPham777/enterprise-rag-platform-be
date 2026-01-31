import { ApiProperty } from '@nestjs/swagger';

export class PositionResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'Senior Software Engineer' })
  name: string;

  @ApiProperty({ example: 5, description: 'Level of the position' })
  level: number;
}

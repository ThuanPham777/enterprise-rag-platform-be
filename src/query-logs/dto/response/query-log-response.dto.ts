import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QueryLogResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiPropertyOptional({ example: 'uuid-string' })
  userId?: string;

  @ApiPropertyOptional({ example: 'What is the company leave policy?' })
  question?: string;

  @ApiPropertyOptional({ example: 250 })
  responseTimeMs?: number;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z' })
  createdAt?: Date;

  @ApiPropertyOptional({ example: 'John Doe' })
  userName?: string;

  @ApiPropertyOptional({ example: 'john.doe@company.com' })
  userEmail?: string;
}

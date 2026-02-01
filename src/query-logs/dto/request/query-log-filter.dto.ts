import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class QueryLogFilterDto {
  @ApiPropertyOptional({
    example: 'uuid-string',
    description: 'Filter by user ID',
  })
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Filter logs after this date',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2024-01-31T23:59:59.999Z',
    description: 'Filter logs before this date',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

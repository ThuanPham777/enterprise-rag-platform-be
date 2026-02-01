import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { SystemLogLevel } from '../../enums/system-log-level.enum';

export class SystemLogFilterDto {
  @ApiPropertyOptional({
    enum: SystemLogLevel,
    description: 'Filter by log level',
  })
  @IsEnum(SystemLogLevel)
  @IsOptional()
  level?: SystemLogLevel;

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

  @ApiPropertyOptional({
    example: 'document',
    description: 'Search in message (partial match)',
  })
  @IsOptional()
  search?: string;
}

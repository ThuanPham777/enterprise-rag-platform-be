import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DataSourceType, DataSourceStatus } from '../../enums';

export class DataSourceResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({
    enum: DataSourceType,
    example: DataSourceType.NOTION,
    description: 'Type of external knowledge source integration',
  })
  type: DataSourceType;

  @ApiPropertyOptional({ example: 'Engineering Team Notion' })
  name?: string;

  @ApiPropertyOptional({
    example: {
      workspaceId: 'notion-workspace-123',
      databases: ['db-id-1', 'db-id-2'],
      syncInterval: 3600,
    },
    description:
      'Integration configuration (sensitive fields like tokens are masked)',
  })
  config?: Record<string, any>;

  @ApiPropertyOptional({
    enum: DataSourceStatus,
    example: DataSourceStatus.ACTIVE,
    description: 'Current status of the data source',
  })
  status?: DataSourceStatus;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z' })
  lastSyncAt?: Date;

  @ApiPropertyOptional({
    example: 150,
    description: 'Number of documents synced from this source',
  })
  documentCount?: number;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z' })
  createdAt?: Date;

  @ApiPropertyOptional({ example: '2024-01-16T08:00:00.000Z' })
  updatedAt?: Date;
}

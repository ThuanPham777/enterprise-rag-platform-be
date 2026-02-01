import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MaxLength,
  IsObject,
  IsEnum,
} from 'class-validator';
import { DataSourceType, DataSourceStatus } from '../../enums';

export class CreateDataSourceRequestDto {
  @ApiProperty({
    enum: DataSourceType,
    example: DataSourceType.NOTION,
    description:
      'Type of external knowledge source integration (NOTION, SLACK, GOOGLE_DRIVE, CONFLUENCE, etc.)',
  })
  @IsEnum(DataSourceType)
  type: DataSourceType;

  @ApiPropertyOptional({
    example: 'Engineering Team Notion',
    description: 'Display name for this data source integration',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    example: {
      workspaceId: 'notion-workspace-123',
      accessToken: 'secret_xxx',
      syncInterval: 3600,
      databases: ['db-id-1', 'db-id-2'],
      includeSubpages: true,
    },
    description: `Configuration JSON for the integration. Structure depends on source type:
    - NOTION: { workspaceId, accessToken, databases[], includeSubpages }
    - SLACK: { workspaceId, accessToken, channels[], syncInterval }
    - GOOGLE_DRIVE: { folderId, credentials, syncInterval }
    - CONFLUENCE: { siteUrl, spaceKey, accessToken }
    - CUSTOM_API: { baseUrl, apiKey, endpoints[] }`,
  })
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;

  @ApiPropertyOptional({
    enum: DataSourceStatus,
    example: DataSourceStatus.ACTIVE,
    description: 'Initial status of the data source',
    default: DataSourceStatus.PENDING_AUTH,
  })
  @IsEnum(DataSourceStatus)
  @IsOptional()
  status?: DataSourceStatus;
}

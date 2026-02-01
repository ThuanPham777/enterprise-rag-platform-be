import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MaxLength,
  IsObject,
  IsEnum,
} from 'class-validator';
import { DataSourceType, DataSourceStatus } from '../../enums';

export class UpdateDataSourceRequestDto {
  @ApiPropertyOptional({
    enum: DataSourceType,
    example: DataSourceType.NOTION,
    description:
      'Type of external knowledge source integration (NOTION, SLACK, GOOGLE_DRIVE, CONFLUENCE, etc.)',
  })
  @IsEnum(DataSourceType)
  @IsOptional()
  type?: DataSourceType;

  @ApiPropertyOptional({
    example: 'Engineering Team Notion - Updated',
    description: 'Display name for this data source integration',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    example: {
      workspaceId: 'notion-workspace-123',
      accessToken: 'updated_secret_xxx',
      syncInterval: 7200,
      databases: ['db-id-1', 'db-id-2', 'db-id-3'],
      includeSubpages: true,
    },
    description: `Configuration JSON for the integration. Structure depends on source type:
    - NOTION: { workspaceId, accessToken, databases[], includeSubpages }
    - SLACK: { workspaceId, accessToken, channels[], syncInterval }
    - GOOGLE_DRIVE: { folderId, credentials, syncInterval }
    - CONFLUENCE: { siteUrl, spaceKey, accessToken }
    - UPLOAD: { allowedMimeTypes[], maxFileSize }`,
  })
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;

  @ApiPropertyOptional({
    enum: DataSourceStatus,
    example: DataSourceStatus.ACTIVE,
    description: 'Status of the data source',
  })
  @IsEnum(DataSourceStatus)
  @IsOptional()
  status?: DataSourceStatus;
}

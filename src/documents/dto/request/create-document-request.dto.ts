import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsObject,
  ValidateNested,
  IsArray,
  Matches,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FileType } from '../../enums/file-type.enum';
import { HasAtLeastOneAccessRule } from '../validators/access-rules.validator';

class AccessRulesDto {
  @ApiProperty({
    example: ['role-uuid-hr'],
    description: 'Role IDs that can access this document',
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  roles?: string[];

  @ApiProperty({
    example: ['dept-uuid-hr'],
    description: 'Department IDs that can access this document',
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  departments?: string[];

  @ApiProperty({
    example: ['position-uuid-manager'],
    description: 'Position IDs that can access this document',
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  positions?: string[];
}

export class CreateDocumentRequestDto {
  @ApiProperty({
    example: 'Leave Policy 2025',
    description: 'Document title',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 's3://company-docs/uploads/2025/03/uuid.pdf',
    description: 'S3 file path (must start with s3://)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^s3:\/\//, {
    message: 'filePath must be a valid S3 path (s3://...)',
  })
  filePath: string;

  @ApiProperty({
    enum: FileType,
    example: FileType.PDF,
    description: 'File type',
  })
  @IsEnum(FileType)
  fileType: FileType;

  @ApiProperty({
    type: AccessRulesDto,
    description: 'Access rules for the document (at least one rule required)',
  })
  @IsObject()
  @ValidateNested()
  @Type(() => AccessRulesDto)
  @HasAtLeastOneAccessRule()
  accessRules: AccessRulesDto;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description:
      'Source ID linking to external knowledge source (Notion, Slack, etc.). Optional for manual uploads.',
  })
  @IsUUID()
  @IsOptional()
  sourceId?: string;

  @ApiPropertyOptional({
    example: { notionPageId: 'abc123', lastModified: '2025-01-15T10:00:00Z' },
    description:
      'Metadata from the external source for tracking and deduplication',
  })
  @IsObject()
  @IsOptional()
  sourceMetadata?: Record<string, any>;
}

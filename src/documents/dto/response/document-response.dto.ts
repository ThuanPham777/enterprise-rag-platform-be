import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentStatus } from '../../enums/document-status.enum';
import { FileType } from '../../enums/file-type.enum';

class AccessRuleDto {
  @ApiPropertyOptional({ example: 'role-uuid-hr' })
  roleId?: string;

  @ApiPropertyOptional({ example: 'dept-uuid-hr' })
  departmentId?: string;

  @ApiPropertyOptional({ example: 'position-uuid-manager' })
  positionId?: string;
}

export class DocumentResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Leave Policy 2025' })
  title: string;

  @ApiProperty({ example: 's3://company-docs/uploads/2025/03/uuid.pdf' })
  filePath: string;

  @ApiProperty({ enum: FileType, example: FileType.PDF })
  fileType: FileType;

  @ApiProperty({ enum: DocumentStatus, example: DocumentStatus.PROCESSING })
  status: DocumentStatus;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  uploadedBy?: string;

  @ApiProperty({ type: [AccessRuleDto] })
  accessRules: AccessRuleDto[];

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z' })
  createdAt?: Date;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt?: Date;
}

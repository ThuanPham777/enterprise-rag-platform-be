import { ApiProperty } from '@nestjs/swagger';
import { DocumentStatus } from '../../enums/document-status.enum';

export class CreateDocumentResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Document ID',
  })
  documentId: string;

  @ApiProperty({
    enum: DocumentStatus,
    example: DocumentStatus.PROCESSING,
    description: 'Document status',
  })
  status: DocumentStatus;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmbeddingJobStatus } from '../../enums/embedding-job-status.enum';

export class EmbeddingJobResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'uuid-string' })
  documentId: string;

  @ApiProperty({
    enum: EmbeddingJobStatus,
    example: EmbeddingJobStatus.PROCESSING,
  })
  status: EmbeddingJobStatus;

  @ApiPropertyOptional({ example: 'Failed to process PDF' })
  errorMessage?: string;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z' })
  startedAt?: Date;

  @ApiPropertyOptional({ example: '2024-01-15T10:35:00.000Z' })
  finishedAt?: Date;

  @ApiPropertyOptional({ example: 'Policy Document.pdf' })
  documentTitle?: string;
}

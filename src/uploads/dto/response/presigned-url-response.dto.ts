import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PresignedUrlResponseDto {
  @ApiProperty({
    example: 'https://s3.amazonaws.com/bucket/path/to/file.pdf?X-Amz-Algorithm=...',
    description: 'Presigned URL for uploading the file',
  })
  uploadUrl: string;

  @ApiProperty({
    example: 'documents/user-id/document_1234567890.pdf',
    description: 'File key/path in storage',
  })
  key: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'URL expiration timestamp',
  })
  expiresAt: Date;

  @ApiProperty({
    example: 'document_1234567890.pdf',
    description: 'Sanitized file name',
  })
  fileName: string;
}

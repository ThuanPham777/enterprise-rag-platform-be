import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadFileResponseDto {
    @ApiProperty({
        example: 'documents/user-id/document_1234567890.pdf',
        description: 'File key/path in storage',
    })
    key: string;

    @ApiProperty({
        example: 'document_1234567890.pdf',
        description: 'Sanitized file name',
    })
    fileName: string;

    @ApiProperty({
        example: 1024000,
        description: 'File size in bytes',
    })
    size: number;

    @ApiProperty({
        example: 'application/pdf',
        description: 'MIME type of the file',
    })
    mimeType: string;
}

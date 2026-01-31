import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class DeleteFileRequestDto {
  @ApiProperty({
    example: 'documents/user-id/document_1234567890.pdf',
    description: 'File key/path in storage',
  })
  @IsString()
  @IsNotEmpty()
  key: string;
}

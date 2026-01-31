import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class GetFileUrlRequestDto {
  @ApiProperty({
    example: 'documents/user-id/document_1234567890.pdf',
    description: 'File key/path in storage',
  })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiPropertyOptional({
    example: 3600,
    description: 'URL expiration time in seconds (default: 3600 = 1 hour)',
    minimum: 60,
    maximum: 86400,
  })
  @IsNumber()
  @Min(60)
  @Max(86400)
  @IsOptional()
  expiresIn?: number;
}

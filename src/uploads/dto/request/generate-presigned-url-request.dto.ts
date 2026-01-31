import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export enum UploadFolder {
  DOCUMENTS = 'documents',
  IMAGES = 'images',
  TEMP = 'temp',
}

export class GeneratePresignedUrlRequestDto {
  @ApiProperty({
    example: 'document.pdf',
    description: 'Original file name',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName: string;

  @ApiProperty({
    example: 'application/pdf',
    description: 'MIME type of the file',
  })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty({
    example: 1024000,
    description: 'File size in bytes',
  })
  @IsNumber()
  @Min(1)
  fileSize: number;

  @ApiPropertyOptional({
    enum: UploadFolder,
    default: UploadFolder.DOCUMENTS,
    description: 'Folder/category for the upload',
  })
  @IsEnum(UploadFolder)
  @IsOptional()
  folder?: UploadFolder;

  @ApiPropertyOptional({
    example: 3600,
    description: 'URL expiration time in seconds (default: 3600 = 1 hour)',
    minimum: 60,
    maximum: 86400,
  })
  @IsNumber()
  @Min(60)
  @Max(86400) // Max 24 hours
  @IsOptional()
  expiresIn?: number;
}

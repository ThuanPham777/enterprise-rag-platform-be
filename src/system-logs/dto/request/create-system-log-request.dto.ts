import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  MaxLength,
} from 'class-validator';
import { SystemLogLevel } from '../../enums/system-log-level.enum';

export class CreateSystemLogRequestDto {
  @ApiProperty({
    enum: SystemLogLevel,
    example: SystemLogLevel.INFO,
    description: 'Log level',
  })
  @IsEnum(SystemLogLevel)
  level: SystemLogLevel;

  @ApiProperty({
    example: 'Document uploaded successfully',
    description: 'Log message',
  })
  @IsString()
  @MaxLength(5000)
  message: string;

  @ApiPropertyOptional({
    example: { documentId: 'uuid', userId: 'uuid', action: 'UPLOAD' },
    description: 'Additional metadata as JSON',
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SystemLogLevel } from '../../enums/system-log-level.enum';

export class SystemLogResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({
    enum: SystemLogLevel,
    example: SystemLogLevel.INFO,
  })
  level: SystemLogLevel;

  @ApiPropertyOptional({ example: 'Document uploaded successfully' })
  message?: string;

  @ApiPropertyOptional({
    example: { documentId: 'uuid', userId: 'uuid', action: 'UPLOAD' },
  })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z' })
  createdAt?: Date;
}

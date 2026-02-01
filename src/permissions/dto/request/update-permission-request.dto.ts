import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdatePermissionRequestDto {
  @ApiPropertyOptional({
    example: 'MANAGE_USERS',
    description: 'Permission code (uppercase)',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  code?: string;

  @ApiPropertyOptional({
    example: 'Permission to manage users',
    description: 'Description of the permission',
  })
  @IsString()
  @IsOptional()
  description?: string;
}

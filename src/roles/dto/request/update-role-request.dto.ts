import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateRoleRequestDto {
  @ApiPropertyOptional({
    example: 'Admin',
    description: 'Name of the role',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({
    example: 'Role with all permissions',
    description: 'Description of the role',
  })
  @IsString()
  @IsOptional()
  description?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class PermissionDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'MANAGE_USERS' })
  code: string;

  @ApiProperty({ example: 'Permission to manage users' })
  description: string;
}

export class CreateRoleResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'Admin' })
  name: string;

  @ApiProperty({ example: 'Role with all permissions' })
  description: string;

  @ApiPropertyOptional({ type: [PermissionDto] })
  permissions?: PermissionDto[];
}

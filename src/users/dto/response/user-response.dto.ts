import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '../../enums/user-status.enum';

class PermissionDto {
    @ApiProperty({ example: 'uuid-string' })
    id: string;

    @ApiProperty({ example: 'MANAGE_USERS' })
    code: string;

    @ApiPropertyOptional({ example: 'Permission to manage users' })
    description?: string;
}

class RolePermissionDto {
    @ApiProperty({ type: PermissionDto })
    permissions: PermissionDto;
}

class RoleDto {
    @ApiProperty({ example: 'uuid-string' })
    id: string;

    @ApiProperty({ example: 'ADMIN' })
    name: string;

    @ApiPropertyOptional({ example: 'System administrator' })
    description?: string;

    @ApiProperty({ type: [RolePermissionDto] })
    role_permissions: RolePermissionDto[];
}

class UserRoleDto {
    @ApiProperty({ type: RoleDto })
    roles: RoleDto;
}

export class UserResponseDto {
    @ApiProperty({ example: 'uuid-string' })
    id: string;

    @ApiProperty({ example: 'user@example.com' })
    email: string;

    @ApiPropertyOptional({ example: 'John Doe' })
    full_name?: string;

  @ApiPropertyOptional({
    example: UserStatus.ACTIVE,
    enum: UserStatus,
    enumName: 'UserStatus',
  })
  status?: UserStatus;

    @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z' })
    created_at?: Date;

    @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z' })
    updated_at?: Date;

    @ApiProperty({ type: [UserRoleDto] })
    user_roles: UserRoleDto[];
}


import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'Admin' })
  name: string;

  @ApiProperty({ example: 'Role with all permissions' })
  description: string;
}

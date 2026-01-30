import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateRoleRequestDto {
  @ApiProperty({
    example: 'Admin',
    description: 'Name of the role',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Role with all permissions',
    description: 'Description of the role',
    required: false,
  })
  @IsString()
  description?: string;
}

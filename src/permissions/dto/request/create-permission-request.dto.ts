import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreatePermissionRequestDto {
  @ApiProperty({
    example: 'READ_USERS',
    description: 'Unique code for the permission',
  })
  @IsString()
  code: string;

  @ApiProperty({
    example: 'Permission to read user data',
    description: 'Description of the permission',
    required: false,
  })
  @IsString()
  description?: string;
}

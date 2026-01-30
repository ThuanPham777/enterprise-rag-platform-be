import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsUUID } from 'class-validator';

export class AssignPermissionsRequestDto {
  @ApiProperty({
    example: [
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001',
    ],
    description: 'Array of permission IDs to assign to the role',
  })
  @IsArray()
  @IsUUID('all', { each: true })
  permissionIds: string[];
}

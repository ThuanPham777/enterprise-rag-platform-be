import { ApiProperty } from '@nestjs/swagger';

export class UserInfoDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: ['admin', 'user'], type: [String] })
  roles: string[];

  @ApiProperty({
    example: ['read:documents', 'write:documents'],
    type: [String],
  })
  permissions?: string[];
}

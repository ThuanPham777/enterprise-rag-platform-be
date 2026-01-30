import { ApiProperty } from '@nestjs/swagger';

export class LogoutResponseDto {
  @ApiProperty({ example: 'success' })
  status: 'success';

  @ApiProperty({ example: 'Logged out successfully' })
  message: string;
}

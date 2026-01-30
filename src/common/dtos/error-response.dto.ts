import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 'error' })
  status: 'error';

  @ApiProperty({ example: 'Invalid credentials' })
  message: string;

  @ApiProperty({ type: [Object], required: false })
  errors?: any[];
}

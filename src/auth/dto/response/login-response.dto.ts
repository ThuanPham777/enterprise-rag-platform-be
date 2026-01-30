import { ApiProperty } from '@nestjs/swagger';
import { TokenResponseDto } from './token-response.dto';

export class LoginResponseDto {
  @ApiProperty({ example: 'success' })
  status: 'success';

  @ApiProperty({ example: 'Login successful' })
  message: string;

  @ApiProperty({ type: TokenResponseDto })
  data: TokenResponseDto;
}

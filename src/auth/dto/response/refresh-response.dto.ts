import { ApiProperty } from '@nestjs/swagger';
import { TokenResponseDto } from './token-response.dto';

export class RefreshResponseDto {
  @ApiProperty({ example: 'success' })
  status: 'success';

  @ApiProperty({ example: 'Token refreshed' })
  message: string;

  @ApiProperty({ type: TokenResponseDto })
  data: TokenResponseDto;
}

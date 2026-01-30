import { ApiProperty } from '@nestjs/swagger';
import { UserInfoDto } from './user-info.dto';

export class MeResponseDto {
  @ApiProperty({ example: 'success' })
  status: 'success';

  @ApiProperty({ type: UserInfoDto })
  data: UserInfoDto;
}

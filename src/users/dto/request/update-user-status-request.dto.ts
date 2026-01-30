import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserStatus, USER_STATUS_VALUES } from '../../enums/user-status.enum';

export class UpdateUserStatusRequestDto {
  @ApiProperty({
    example: UserStatus.ACTIVE,
    description: 'New status of the user',
    enum: UserStatus,
    enumName: 'UserStatus',
  })
  @IsEnum(UserStatus, {
    message: `Status must be one of: ${USER_STATUS_VALUES.join(', ')}`,
  })
  status: UserStatus;
}

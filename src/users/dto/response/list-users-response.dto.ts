import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

export class ListUsersResponseDto {
    @ApiProperty({ type: [UserResponseDto] })
    users: UserResponseDto[];
}


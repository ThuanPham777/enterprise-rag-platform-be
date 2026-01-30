import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '../../enums/user-status.enum';

export class UpdateUserStatusResponseDto {
    @ApiProperty({ example: 'uuid-string' })
    id: string;

    @ApiProperty({ example: 'user@example.com' })
    email: string;

    @ApiPropertyOptional({ example: 'John Doe' })
    full_name?: string;

    @ApiProperty({
        example: UserStatus.ACTIVE,
        enum: UserStatus,
        enumName: 'UserStatus',
    })
    status: UserStatus;

    @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z' })
    created_at?: Date;

    @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z' })
    updated_at?: Date;
}


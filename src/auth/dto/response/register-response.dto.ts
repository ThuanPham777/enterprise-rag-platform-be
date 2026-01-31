import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterResponseDto {
    @ApiProperty({ example: 'uuid-string' })
    id: string;

    @ApiProperty({ example: 'user@example.com' })
    email: string;

    @ApiPropertyOptional({ example: 'John Doe' })
    fullName: string | null;

    @ApiProperty({ example: 'ACTIVE' })
    status: string;

    @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z' })
    createdAt: Date | null;
}

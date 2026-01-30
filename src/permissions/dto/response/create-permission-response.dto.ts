import { ApiProperty } from "@nestjs/swagger";

export class CreatePermissionResponseDto {
    @ApiProperty({ example: 'uuid-string' })
    id: string

    @ApiProperty({
        example: 'READ_USERS',
        description: 'Unique code for the permission',
    })
    code: string;

    @ApiProperty({
        example: 'Permission to read user data',
        description: 'Description of the permission',
        required: false,
    })
    description: string;
}
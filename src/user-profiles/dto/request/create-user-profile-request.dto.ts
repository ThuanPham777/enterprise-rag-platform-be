import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsDateString } from 'class-validator';

export class CreateUserProfileRequestDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User ID',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Department ID',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440002',
    description: 'Position ID',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  positionId?: string;

  @ApiProperty({
    example: '2024-01-15',
    description: 'Date when user joined the organization',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  joinedAt?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Chat ID',
  })
  id: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'User ID who owns this chat',
  })
  userId: string;

  @ApiPropertyOptional({
    example: 'Leave Policy Discussion',
    description: 'Chat title',
  })
  title?: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Chat creation timestamp',
  })
  createdAt?: Date;

  @ApiProperty({
    example: 5,
    description: 'Number of messages in this chat',
  })
  messageCount?: number;
}

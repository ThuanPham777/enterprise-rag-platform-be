import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageRole } from '../../enums/message-role.enum';

export class MessageResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Message ID',
  })
  id: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Chat ID this message belongs to',
  })
  chatId: string;

  @ApiProperty({
    example: 'user',
    enum: MessageRole,
    description: 'Message role (user or assistant)',
  })
  role: MessageRole;

  @ApiProperty({
    example: 'What is the company leave policy?',
    description: 'Message content',
  })
  content: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Message creation timestamp',
  })
  createdAt?: Date;
}

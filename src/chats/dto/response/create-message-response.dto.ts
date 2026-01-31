import { ApiProperty } from '@nestjs/swagger';
import { MessageRole } from '../../enums/message-role.enum';

export class CreateMessageResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Created message ID',
  })
  messageId: string;

  @ApiProperty({
    example: 'user',
    enum: MessageRole,
    description: 'Message role',
  })
  role: MessageRole;

  @ApiProperty({
    example: 'What is the company leave policy?',
    description: 'Message content',
  })
  content: string;
}

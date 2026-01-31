import { ApiProperty } from '@nestjs/swagger';

export class CreateChatResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Created chat ID',
  })
  chatId: string;

  @ApiProperty({
    example: 'Leave Policy Discussion',
    description: 'Chat title',
    required: false,
  })
  title?: string;
}

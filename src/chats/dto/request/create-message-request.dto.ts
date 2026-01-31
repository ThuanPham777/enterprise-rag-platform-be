import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateMessageRequestDto {
  @ApiProperty({
    example: 'What is the company leave policy?',
    description: 'Message content/question from user',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Chat ID to send message to',
  })
  @IsUUID()
  @IsNotEmpty()
  chatId: string;
}

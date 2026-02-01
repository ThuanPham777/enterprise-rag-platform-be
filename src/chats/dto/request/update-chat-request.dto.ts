import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateChatRequestDto {
  @ApiPropertyOptional({
    example: 'Leave Policy Discussion',
    description: 'New title for the chat',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;
}

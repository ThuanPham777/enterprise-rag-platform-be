import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateChatRequestDto {
  @ApiPropertyOptional({
    example: 'Leave Policy Discussion',
    description: 'Optional title for the chat',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;
}

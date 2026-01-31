import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { ChatsService } from './chats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ApiResponseDto } from '../common/dtos/api-response.dto';
import { ErrorResponseDto } from '../common/dtos/error-response.dto';
import { CreateChatRequestDto } from './dto/request/create-chat-request.dto';
import { CreateChatResponseDto } from './dto/response/create-chat-response.dto';
import { ChatResponseDto } from './dto/response/chat-response.dto';
import type { Request } from 'express';

@ApiTags('Chats')
@ApiBearerAuth('access-token')
@Controller('chats')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Permissions('QUERY_KNOWLEDGE')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new chat',
    description: 'Create a new chat session for the authenticated user',
  })
  @ApiBody({ type: CreateChatRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Chat created successfully',
    type: CreateChatResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async createChat(
    @Req() req: Request,
    @Body() dto: CreateChatRequestDto,
  ): Promise<ApiResponseDto<CreateChatResponseDto>> {
    const userId = (req as any).user.userId;
    const result = await this.chatsService.create(userId, dto);
    return ApiResponseDto.success(result, 'Chat created successfully');
  }

  @Permissions('QUERY_KNOWLEDGE')
  @Get()
  @ApiOperation({
    summary: 'Get all chats',
    description: 'Retrieve all chats for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Chats retrieved successfully',
    type: ChatResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getChats(@Req() req: Request): Promise<ApiResponseDto<ChatResponseDto[]>> {
    const userId = (req as any).user.userId;
    const chats = await this.chatsService.findAll(userId);
    return ApiResponseDto.success(chats);
  }

  @Permissions('QUERY_KNOWLEDGE')
  @Get(':id')
  @ApiOperation({
    summary: 'Get chat by ID',
    description: 'Retrieve a specific chat by ID (only if owned by user)',
  })
  @ApiParam({
    name: 'id',
    description: 'Chat ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Chat retrieved successfully',
    type: ChatResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Chat not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getChat(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<ApiResponseDto<ChatResponseDto>> {
    const userId = (req as any).user.userId;
    const chat = await this.chatsService.findOne(id, userId);
    return ApiResponseDto.success(chat);
  }

  @Permissions('QUERY_KNOWLEDGE')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete chat',
    description: 'Delete a chat and all its messages (only if owned by user)',
  })
  @ApiParam({
    name: 'id',
    description: 'Chat ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Chat deleted successfully',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Chat not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async deleteChat(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<ApiResponseDto<null>> {
    const userId = (req as any).user.userId;
    await this.chatsService.delete(id, userId);
    return ApiResponseDto.success(null, 'Chat deleted successfully');
  }
}

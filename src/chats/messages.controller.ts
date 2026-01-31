import {
    Controller,
    Get,
    Post,
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
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ApiResponseDto } from '../common/dtos/api-response.dto';
import { ErrorResponseDto } from '../common/dtos/error-response.dto';
import { CreateMessageRequestDto } from './dto/request/create-message-request.dto';
import { CreateMessageResponseDto } from './dto/response/create-message-response.dto';
import { MessageResponseDto } from './dto/response/message-response.dto';
import type { Request } from 'express';

@ApiTags('Messages')
@ApiBearerAuth('access-token')
@Controller('messages')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) { }

    @Permissions('QUERY_KNOWLEDGE')
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Send a message and get RAG response',
        description:
            'Send a user message to a chat. The system will query the knowledge base using RAG and return both the user message and assistant response.',
    })
    @ApiBody({ type: CreateMessageRequestDto })
    @ApiResponse({
        status: 201,
        description: 'Message sent successfully',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string', example: 'success' },
                message: { type: 'string', example: 'Message sent successfully' },
                data: {
                    type: 'object',
                    properties: {
                        userMessage: {
                            type: 'object',
                            properties: {
                                messageId: { type: 'string' },
                                role: { type: 'string', enum: ['user'] },
                                content: { type: 'string' },
                            },
                        },
                        assistantMessage: {
                            type: 'object',
                            properties: {
                                messageId: { type: 'string' },
                                role: { type: 'string', enum: ['assistant'] },
                                content: { type: 'string' },
                            },
                        },
                    },
                },
            },
        },
    })
    @ApiResponse({
        status: 400,
        description: 'Validation error',
        type: ErrorResponseDto,
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
    async sendMessage(
        @Req() req: Request,
        @Body() dto: CreateMessageRequestDto,
    ): Promise<
        ApiResponseDto<{
            userMessage: CreateMessageResponseDto;
            assistantMessage: CreateMessageResponseDto;
        }>
    > {
        const userId = (req as any).user.userId;
        const result = await this.messagesService.create(userId, dto);
        return ApiResponseDto.success(result, 'Message sent successfully');
    }

    @Permissions('QUERY_KNOWLEDGE')
    @Get('chat/:chatId')
    @ApiOperation({
        summary: 'Get all messages for a chat',
        description:
            'Retrieve all messages (user and assistant) for a specific chat, ordered by creation time',
    })
    @ApiParam({
        name: 'chatId',
        description: 'Chat ID',
        type: String,
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @ApiResponse({
        status: 200,
        description: 'Messages retrieved successfully',
        type: MessageResponseDto,
        isArray: true,
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
    async getMessages(
        @Req() req: Request,
        @Param('chatId') chatId: string,
    ): Promise<ApiResponseDto<MessageResponseDto[]>> {
        const userId = (req as any).user.userId;
        const messages = await this.messagesService.findByChatId(chatId, userId);
        return ApiResponseDto.success(messages);
    }
}

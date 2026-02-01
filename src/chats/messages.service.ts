import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateUUID } from '../common/utils/uuid.util';
import { CreateMessageRequestDto } from './dto/request/create-message-request.dto';
import { MessageResponseDto } from './dto/response/message-response.dto';
import { MessageRole } from './enums/message-role.enum';
import { RagServiceClient } from '../rag/services/rag-service.client';
import { QueryLogsService } from '../query-logs/query-logs.service';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private prisma: PrismaService,
    private ragServiceClient: RagServiceClient,
    @Inject(forwardRef(() => QueryLogsService))
    private queryLogsService: QueryLogsService,
  ) {}

  /**
   * Create a message and get RAG response
   */
  async create(
    userId: string,
    dto: CreateMessageRequestDto,
  ): Promise<{
    userMessage: { messageId: string; role: MessageRole; content: string };
    assistantMessage: { messageId: string; role: MessageRole; content: string };
  }> {
    // Verify chat exists and belongs to user
    const chat = await (this.prisma as any).chats.findUnique({
      where: { id: dto.chatId },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    if (chat.user_id !== userId) {
      throw new NotFoundException('Chat not found');
    }

    // Get user context for RAG query
    const userContext = await this.getUserContext(userId);

    // Create user message
    const userMessage = await (this.prisma as any).messages.create({
      data: {
        id: generateUUID(),
        chat_id: dto.chatId,
        role: MessageRole.USER,
        content: dto.content,
      },
    });

    this.logger.log(`User message created: ${userMessage.id}`);

    // Query RAG service for answer
    let assistantContent =
      'I apologize, but I could not retrieve an answer at this time.';
    let sources: any[] = [];
    const startTime = Date.now();

    try {
      const ragResponse = await this.ragServiceClient.query({
        question: dto.content,
        user_context: {
          user_id: userId,
          department_ids: userContext.departmentIds,
          position_level: userContext.positionLevel,
          role_ids: userContext.roleIds,
        },
        top_k: 5,
      });

      assistantContent = ragResponse.answer;
      sources = ragResponse.sources || [];

      const responseTimeMs = Date.now() - startTime;

      // Log the query
      this.queryLogsService
        .create(userId, dto.content, responseTimeMs)
        .catch((err) => {
          this.logger.warn(`Failed to log query: ${err.message}`);
        });

      this.logger.log(
        `RAG query successful for chat ${dto.chatId}, got ${sources.length} sources (${responseTimeMs}ms)`,
      );
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;

      // Log failed query
      this.queryLogsService
        .create(userId, dto.content, responseTimeMs)
        .catch((err) => {
          this.logger.warn(`Failed to log query: ${err.message}`);
        });

      this.logger.error(
        `Failed to query RAG service for chat ${dto.chatId}:`,
        error,
      );
      // Continue with default message
    }

    // Create assistant message
    const assistantMessage = await (this.prisma as any).messages.create({
      data: {
        id: generateUUID(),
        chat_id: dto.chatId,
        role: MessageRole.ASSISTANT,
        content: assistantContent,
      },
    });

    this.logger.log(`Assistant message created: ${assistantMessage.id}`);

    return {
      userMessage: {
        messageId: userMessage.id,
        role: MessageRole.USER,
        content: userMessage.content || '',
      },
      assistantMessage: {
        messageId: assistantMessage.id,
        role: MessageRole.ASSISTANT,
        content: assistantMessage.content || '',
      },
    };
  }

  /**
   * Get all messages for a chat
   */
  async findByChatId(
    chatId: string,
    userId: string,
  ): Promise<MessageResponseDto[]> {
    // Verify chat exists and belongs to user
    const chat = await (this.prisma as any).chats.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    if (chat.user_id !== userId) {
      throw new NotFoundException('Chat not found');
    }

    const messages = await (this.prisma as any).messages.findMany({
      where: { chat_id: chatId },
      orderBy: { created_at: 'asc' },
    });

    return messages.map((msg: any) => ({
      id: msg.id,
      chatId: msg.chat_id,
      role: msg.role as MessageRole,
      content: msg.content || '',
      createdAt: msg.created_at || undefined,
    }));
  }

  /**
   * Get user context for RAG query
   */
  private async getUserContext(userId: string): Promise<{
    departmentIds: string[];
    positionLevel: number;
    roleIds: string[];
  }> {
    // Get user profile
    const profile = await (this.prisma as any).user_profiles.findUnique({
      where: { user_id: userId },
      include: {
        departments: true,
        positions: true,
      },
    });

    // Get user roles
    const userRoles = await (this.prisma as any).user_roles.findMany({
      where: { user_id: userId },
    });

    const departmentIds: string[] = [];
    let positionLevel = 0;

    if (profile) {
      if (profile.department_id) {
        departmentIds.push(profile.department_id);
      }
      if (profile.position_id && profile.positions) {
        positionLevel = profile.positions.level || 0;
      }
    }

    const roleIds = userRoles.map((ur: any) => ur.role_id);

    return {
      departmentIds,
      positionLevel,
      roleIds,
    };
  }
}

import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChatRequestDto } from './dto/request/create-chat-request.dto';
import { ChatResponseDto } from './dto/response/chat-response.dto';

@Injectable()
export class ChatsService {
  private readonly logger = new Logger(ChatsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new chat
   */
  async create(
    userId: string,
    dto: CreateChatRequestDto,
  ): Promise<{ chatId: string; title?: string }> {
    const chat = await (this.prisma as any).chats.create({
      data: {
        id: this.generateUUID(),
        user_id: userId,
        title: dto.title || null,
      },
    });

    this.logger.log(`Chat created: ${chat.id} for user: ${userId}`);

    return {
      chatId: chat.id,
      title: chat.title || undefined,
    };
  }

  /**
   * Get all chats for a user
   */
  async findAll(userId: string): Promise<ChatResponseDto[]> {
    const chats = await (this.prisma as any).chats.findMany({
      where: { user_id: userId },
      include: {
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return chats.map((chat: any) => ({
      id: chat.id,
      userId: chat.user_id,
      title: chat.title || undefined,
      createdAt: chat.created_at || undefined,
      messageCount: chat._count?.messages || 0,
    }));
  }

  /**
   * Get chat by ID (with access control - only owner can access)
   */
  async findOne(id: string, userId: string): Promise<ChatResponseDto> {
    const chat = await (this.prisma as any).chats.findUnique({
      where: { id },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Verify ownership
    if (chat.user_id !== userId) {
      throw new NotFoundException('Chat not found');
    }

    return {
      id: chat.id,
      userId: chat.user_id,
      title: chat.title || undefined,
      createdAt: chat.created_at || undefined,
      messageCount: chat._count?.messages || 0,
    };
  }

  /**
   * Delete chat
   */
  async delete(id: string, userId: string): Promise<void> {
    const chat = await (this.prisma as any).chats.findUnique({
      where: { id },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Verify ownership
    if (chat.user_id !== userId) {
      throw new NotFoundException('Chat not found');
    }

    // Delete messages first (cascade should handle this, but explicit is better)
    await (this.prisma as any).messages.deleteMany({
      where: { chat_id: id },
    });

    // Delete chat
    await (this.prisma as any).chats.delete({
      where: { id },
    });

    this.logger.log(`Chat deleted: ${id}`);
  }

  /**
   * Generate UUID v4 using crypto
   */
  private generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for older Node.js versions
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  }
}

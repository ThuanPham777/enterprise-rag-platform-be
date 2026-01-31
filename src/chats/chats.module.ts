import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatsController } from './chats.controller';
import { MessagesController } from './messages.controller';
import { ChatsService } from './chats.service';
import { MessagesService } from './messages.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [ConfigModule, PrismaModule, RagModule],
  controllers: [ChatsController, MessagesController],
  providers: [ChatsService, MessagesService],
  exports: [ChatsService, MessagesService],
})
export class ChatsModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RagServiceClient } from './services/rag-service.client';

@Module({
  imports: [ConfigModule],
  providers: [RagServiceClient],
  exports: [RagServiceClient],
})
export class RagModule {}

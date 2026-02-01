import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RagModule } from '../rag/rag.module';
import { UploadsModule } from '../uploads/uploads.module';
import { EmbeddingJobsModule } from '../embedding-jobs/embedding-jobs.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RagModule,
    UploadsModule,
    forwardRef(() => EmbeddingJobsModule),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}

import { Module } from '@nestjs/common';
import { EmbeddingJobsController } from './embedding-jobs.controller';
import { EmbeddingJobsService } from './embedding-jobs.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EmbeddingJobsController],
  providers: [EmbeddingJobsService],
  exports: [EmbeddingJobsService],
})
export class EmbeddingJobsModule {}

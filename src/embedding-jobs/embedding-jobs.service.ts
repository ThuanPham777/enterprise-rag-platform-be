import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateUUID } from '../common/utils/uuid.util';
import { EmbeddingJobResponseDto } from './dto/response/embedding-job-response.dto';
import { EmbeddingJobStatus } from './enums/embedding-job-status.enum';

@Injectable()
export class EmbeddingJobsService {
  private readonly logger = new Logger(EmbeddingJobsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get all embedding jobs
   */
  async findAll(): Promise<EmbeddingJobResponseDto[]> {
    const jobs = await this.prisma.embedding_jobs.findMany({
      include: {
        documents: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { started_at: 'desc' },
    });

    return jobs.map((job) => this.mapToResponseDto(job));
  }

  /**
   * Get embedding jobs by document ID
   */
  async findByDocumentId(
    documentId: string,
  ): Promise<EmbeddingJobResponseDto[]> {
    const jobs = await this.prisma.embedding_jobs.findMany({
      where: { document_id: documentId },
      include: {
        documents: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { started_at: 'desc' },
    });

    return jobs.map((job) => this.mapToResponseDto(job));
  }

  /**
   * Get embedding job by ID
   */
  async findById(id: string): Promise<EmbeddingJobResponseDto> {
    const job = await this.prisma.embedding_jobs.findUnique({
      where: { id },
      include: {
        documents: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Embedding job not found');
    }

    return this.mapToResponseDto(job);
  }

  /**
   * Create a new embedding job (called when document ingestion starts)
   */
  async create(documentId: string): Promise<EmbeddingJobResponseDto> {
    // Verify document exists
    const document = await this.prisma.documents.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const job = await this.prisma.embedding_jobs.create({
      data: {
        id: generateUUID(),
        document_id: documentId,
        status: EmbeddingJobStatus.PENDING,
        started_at: new Date(),
      },
      include: {
        documents: {
          select: {
            title: true,
          },
        },
      },
    });

    this.logger.log(
      `Created embedding job ${job.id} for document ${documentId}`,
    );

    return this.mapToResponseDto(job);
  }

  /**
   * Update job status to PROCESSING
   */
  async markProcessing(id: string): Promise<EmbeddingJobResponseDto> {
    const job = await this.prisma.embedding_jobs.update({
      where: { id },
      data: {
        status: EmbeddingJobStatus.PROCESSING,
        started_at: new Date(),
      },
      include: {
        documents: {
          select: {
            title: true,
          },
        },
      },
    });

    this.logger.log(`Embedding job ${id} marked as PROCESSING`);

    return this.mapToResponseDto(job);
  }

  /**
   * Update job status to COMPLETED
   */
  async markCompleted(id: string): Promise<EmbeddingJobResponseDto> {
    const job = await this.prisma.embedding_jobs.update({
      where: { id },
      data: {
        status: EmbeddingJobStatus.COMPLETED,
        finished_at: new Date(),
      },
      include: {
        documents: {
          select: {
            title: true,
          },
        },
      },
    });

    this.logger.log(`Embedding job ${id} marked as COMPLETED`);

    return this.mapToResponseDto(job);
  }

  /**
   * Update job status to FAILED with error message
   */
  async markFailed(
    id: string,
    errorMessage: string,
  ): Promise<EmbeddingJobResponseDto> {
    const job = await this.prisma.embedding_jobs.update({
      where: { id },
      data: {
        status: EmbeddingJobStatus.FAILED,
        error_message: errorMessage,
        finished_at: new Date(),
      },
      include: {
        documents: {
          select: {
            title: true,
          },
        },
      },
    });

    this.logger.error(`Embedding job ${id} marked as FAILED: ${errorMessage}`);

    return this.mapToResponseDto(job);
  }

  /**
   * Delete embedding job
   */
  async delete(id: string): Promise<void> {
    const job = await this.prisma.embedding_jobs.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException('Embedding job not found');
    }

    await this.prisma.embedding_jobs.delete({
      where: { id },
    });

    this.logger.log(`Deleted embedding job ${id}`);
  }

  /**
   * Delete all embedding jobs for a document
   */
  async deleteByDocumentId(documentId: string): Promise<number> {
    const result = await this.prisma.embedding_jobs.deleteMany({
      where: { document_id: documentId },
    });

    this.logger.log(
      `Deleted ${result.count} embedding jobs for document ${documentId}`,
    );

    return result.count;
  }

  /**
   * Get jobs by status
   */
  async findByStatus(
    status: EmbeddingJobStatus,
  ): Promise<EmbeddingJobResponseDto[]> {
    const jobs = await this.prisma.embedding_jobs.findMany({
      where: { status },
      include: {
        documents: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { started_at: 'desc' },
    });

    return jobs.map((job) => this.mapToResponseDto(job));
  }

  private mapToResponseDto(job: any): EmbeddingJobResponseDto {
    return {
      id: job.id,
      documentId: job.document_id,
      status: job.status as EmbeddingJobStatus,
      errorMessage: job.error_message || undefined,
      startedAt: job.started_at || undefined,
      finishedAt: job.finished_at || undefined,
      documentTitle: job.documents?.title || undefined,
    };
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateUUID } from '../common/utils/uuid.util';
import { CreateDocumentRequestDto } from './dto/request/create-document-request.dto';
import { DocumentResponseDto } from './dto/response/document-response.dto';
import { DocumentStatus } from './enums/document-status.enum';
import { RagServiceClient } from '../rag/services/rag-service.client';
import { STORAGE_PROVIDER_TOKEN } from '../uploads/constants/storage-provider.token';
import type { IStorageProvider } from '../uploads/interfaces/storage-provider.interface';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private prisma: PrismaService,
    private ragServiceClient: RagServiceClient,
    @Inject(STORAGE_PROVIDER_TOKEN)
    private storageProvider: IStorageProvider,
  ) { }

  /**
   * Create a new document with access rules (transaction)
   */
  async create(
    userId: string,
    dto: CreateDocumentRequestDto,
  ): Promise<{ documentId: string; status: DocumentStatus }> {
    // Validate access rules - at least one rule required
    const hasRoles = dto.accessRules.roles && dto.accessRules.roles.length > 0;
    const hasDepartments =
      dto.accessRules.departments && dto.accessRules.departments.length > 0;
    const hasPositions =
      dto.accessRules.positions && dto.accessRules.positions.length > 0;

    if (!hasRoles && !hasDepartments && !hasPositions) {
      throw new BadRequestException(
        'At least one access rule (roles, departments, or positions) is required',
      );
    }

    // Validate that referenced entities exist
    await this.validateAccessRules(dto.accessRules);

    // Use transaction to ensure atomicity
    const document = await this.prisma.$transaction(async (tx) => {
      // 1. Create document
      const doc = await (tx as any).documents.create({
        data: {
          id: generateUUID(),
          title: dto.title,
          file_path: dto.filePath,
          file_type: dto.fileType,
          status: DocumentStatus.PROCESSING,
          uploaded_by: userId,
          source_type: 'UPLOAD', // Default source type
        },
      });

      // 2. Create access rules
      const accessRulesData: any[] = [];

      if (dto.accessRules.roles) {
        for (const roleId of dto.accessRules.roles) {
          accessRulesData.push({
            id: generateUUID(),
            document_id: doc.id,
            role_id: roleId,
            access_level: 'READ',
          });
        }
      }

      if (dto.accessRules.departments) {
        for (const deptId of dto.accessRules.departments) {
          accessRulesData.push({
            id: generateUUID(),
            document_id: doc.id,
            department_id: deptId,
            access_level: 'READ',
          });
        }
      }

      if (dto.accessRules.positions) {
        for (const positionId of dto.accessRules.positions) {
          accessRulesData.push({
            id: generateUUID(),
            document_id: doc.id,
            position_id: positionId,
            access_level: 'READ',
          });
        }
      }

      if (accessRulesData.length > 0) {
        await (tx as any).document_access_rules.createMany({
          data: accessRulesData,
        });
      }

      return doc;
    });

    // Trigger RAG ingestion asynchronously (don't wait)
    this.triggerRagIngestion(document.id, dto).catch((error) => {
      this.logger.error(
        `Failed to trigger RAG ingestion for document ${document.id}:`,
        error,
      );
    });

    return {
      documentId: document.id,
      status: document.status as DocumentStatus,
    };
  }

  /**
   * Get all documents
   */
  async findAll(): Promise<DocumentResponseDto[]> {
    const documents = await (this.prisma as any).documents.findMany({
      include: {
        document_access_rules: {
          include: {
            roles: true,
            departments: true,
            positions: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return documents.map((doc) => this.mapToResponseDto(doc));
  }

  /**
   * Get document by ID
   */
  async findOne(id: string): Promise<DocumentResponseDto> {
    const document = await (this.prisma as any).documents.findUnique({
      where: { id },
      include: {
        document_access_rules: {
          include: {
            roles: true,
            departments: true,
            positions: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return this.mapToResponseDto(document);
  }

  /**
   * Delete document
   */
  async delete(id: string): Promise<void> {
    const document = await (this.prisma as any).documents.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Delete access rules first (cascade should handle this, but explicit is better)
    await (this.prisma as any).document_access_rules.deleteMany({
      where: { document_id: id },
    });

    // Delete document from database
    await (this.prisma as any).documents.delete({
      where: { id },
    });

    // Delete document from RAG service asynchronously (don't wait)
    this.ragServiceClient.deleteDocument(id).catch((error) => {
      this.logger.error(
        `Failed to delete document from RAG service ${id}:`,
        error,
      );
      // Don't throw - document is already deleted from DB
      // RAG service cleanup can be done manually if needed
    });

    this.logger.log(`Document deleted: ${id}`);
  }

  /**
   * Validate access rules - ensure referenced entities exist
   */
  private async validateAccessRules(
    accessRules: CreateDocumentRequestDto['accessRules'],
  ): Promise<void> {
    const errors: string[] = [];

    if (accessRules.roles) {
      for (const roleId of accessRules.roles) {
        const role = await (this.prisma as any).roles.findUnique({
          where: { id: roleId },
        });
        if (!role) {
          errors.push(`Role not found: ${roleId}`);
        }
      }
    }

    if (accessRules.departments) {
      for (const deptId of accessRules.departments) {
        const dept = await (this.prisma as any).departments.findUnique({
          where: { id: deptId },
        });
        if (!dept) {
          errors.push(`Department not found: ${deptId}`);
        }
      }
    }

    if (accessRules.positions) {
      for (const positionId of accessRules.positions) {
        const position = await (this.prisma as any).positions.findUnique({
          where: { id: positionId },
        });
        if (!position) {
          errors.push(`Position not found: ${positionId}`);
        }
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Invalid access rules',
        errors,
      });
    }
  }

  /**
   * Trigger RAG ingestion asynchronously
   */
  private async triggerRagIngestion(
    documentId: string,
    dto: CreateDocumentRequestDto,
  ): Promise<void> {
    // Extract department IDs, role IDs, and position IDs from access rules
    const departmentIds = dto.accessRules.departments || [];
    const roleIds = dto.accessRules.roles || [];
    const positionIds = dto.accessRules.positions || [];

    // Get position level from positions (use highest level)
    let positionLevel: number | undefined;
    if (positionIds.length > 0) {
      const positions = await (this.prisma as any).positions.findMany({
        where: { id: { in: positionIds } },
      });
      if (positions.length > 0) {
        positionLevel = Math.max(...positions.map((p: any) => p.level));
      }
    }

    // Download file from S3 to local temp directory if needed
    let localFilePath = dto.filePath;
    let shouldCleanup = false;

    if (dto.filePath.startsWith('s3://')) {
      try {
        // Create temp file path
        const tempDir = path.join(os.tmpdir(), 'rag-ingestion');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        const fileName = path.basename(dto.filePath) || `${documentId}.pdf`;
        localFilePath = path.join(tempDir, `${documentId}_${fileName}`);
        shouldCleanup = true;

        // Download from S3
        await this.storageProvider.downloadFile({
          key: dto.filePath,
          localPath: localFilePath,
        });

        this.logger.log(
          `Downloaded file from S3 to local: ${dto.filePath} -> ${localFilePath}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to download file from S3 for RAG ingestion: ${error}`,
        );
        // Don't throw - let RAG service handle the error
        // But use original path so error is clear
        localFilePath = dto.filePath;
      }
    }

    try {
      await this.ragServiceClient.triggerIngestion({
        documentId,
        filePath: localFilePath,
        fileType: dto.fileType as string, // Convert enum to string
        departmentIds,
        positionLevel,
        roleIds,
      });

      // Cleanup temp file after a delay (RAG service processes async)
      // Note: In production, you might want to use a job queue or callback
      // to cleanup after RAG service confirms processing
      if (shouldCleanup) {
        setTimeout(() => {
          try {
            if (fs.existsSync(localFilePath)) {
              fs.unlinkSync(localFilePath);
              this.logger.log(`Cleaned up temp file: ${localFilePath}`);
            }
          } catch (error) {
            this.logger.warn(`Failed to cleanup temp file: ${localFilePath}`, error);
          }
        }, 60000); // Cleanup after 1 minute
      }
    } catch (error) {
      // Cleanup on error
      if (shouldCleanup && fs.existsSync(localFilePath)) {
        try {
          fs.unlinkSync(localFilePath);
        } catch (cleanupError) {
          this.logger.warn(`Failed to cleanup temp file on error`, cleanupError);
        }
      }
      throw error;
    }
  }

  /**
   * Map database model to response DTO
   */
  private mapToResponseDto(document: any): DocumentResponseDto {
    return {
      id: document.id,
      title: document.title,
      filePath: document.file_path || '',
      fileType: document.file_type as any,
      status: document.status as DocumentStatus,
      uploadedBy: document.uploaded_by || undefined,
      accessRules: document.document_access_rules.map((rule: any) => ({
        roleId: rule.role_id || undefined,
        departmentId: rule.department_id || undefined,
        positionId: rule.position_id || undefined,
      })),
      createdAt: document.created_at || undefined,
      updatedAt: document.updated_at || undefined,
    };
  }

}

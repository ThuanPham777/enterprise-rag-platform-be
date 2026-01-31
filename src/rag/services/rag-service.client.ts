import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface IngestRequest {
    document_id: string;
    file_path: string;
    file_type: string;
    metadata: {
        department_ids: string[];
        position_level?: number;
        role_ids: string[];
    };
    chunk_size?: number;
    chunk_overlap?: number;
    chunking_strategy?: string;
}


@Injectable()
export class RagServiceClient {
    private readonly logger = new Logger(RagServiceClient.name);
    private readonly baseUrl: string;

    constructor(private configService: ConfigService) {
        this.baseUrl =
            this.configService.get<string>('RAG_SERVICE_URL') ||
            'http://localhost:8000';
    }

    /**
     * Trigger RAG ingestion for a document
     * This is called asynchronously after document creation
     */
    async triggerIngestion(request: {
        documentId: string;
        filePath: string;
        fileType: string; // Accept string to avoid circular dependency
        departmentIds: string[];
        positionLevel?: number;
        roleIds: string[];
    }): Promise<void> {
        try {
            // Convert S3 path to local file path if needed
            // RAG service expects local file path, so we need to handle S3 paths
            // For now, we'll pass the S3 path - RAG service should download from S3
            // TODO: Implement S3 download to local temp directory if needed
            const filePath = this.convertS3ToLocalPath(request.filePath);

            const ingestRequest: IngestRequest = {
                document_id: request.documentId,
                file_path: filePath,
                file_type: request.fileType,
                metadata: {
                    department_ids: request.departmentIds,
                    position_level: request.positionLevel,
                    role_ids: request.roleIds,
                },
                chunking_strategy: 'semantic',
            };

            this.logger.log(
                `Triggering RAG ingestion for document ${request.documentId} at ${this.baseUrl}`,
            );

            // Call RAG service API (async - don't wait)
            const response = await fetch(`${this.baseUrl}/api/v1/ingest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ingestRequest),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `RAG service ingestion failed: ${response.status} - ${errorText}`,
                );
            }

            const result = await response.json();
            this.logger.log(
                `RAG ingestion triggered for document: ${request.documentId}, status: ${result.status}`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to trigger RAG ingestion for ${request.documentId}:`,
                error,
            );
            // Don't throw - we don't want to fail document creation if RAG fails
            // The document will remain in PROCESSING status
            // In production, you might want to implement retry logic or queue system
        }
    }

    /**
     * Get document ingestion status
     */
    async getDocumentStatus(documentId: string): Promise<{
        document_id: string;
        exists: boolean;
        chunk_count: number;
    }> {
        try {
            const response = await fetch(
                `${this.baseUrl}/api/v1/ingest/${documentId}/status`,
                {
                    method: 'GET',
                },
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `RAG service status check failed: ${response.status} - ${errorText}`,
                );
            }

            return await response.json();
        } catch (error) {
            this.logger.error(
                `Failed to get document status for ${documentId}:`,
                error,
            );
            throw error;
        }
    }

    /**
     * Delete document from RAG service
     */
    async deleteDocument(documentId: string): Promise<{
        status: string;
        document_id: string;
        chunks_deleted: number;
    }> {
        try {
            const response = await fetch(
                `${this.baseUrl}/api/v1/ingest/${documentId}`,
                {
                    method: 'DELETE',
                },
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `RAG service delete failed: ${response.status} - ${errorText}`,
                );
            }

            return await response.json();
        } catch (error) {
            this.logger.error(
                `Failed to delete document from RAG service ${documentId}:`,
                error,
            );
            throw error;
        }
    }

    /**
     * Convert S3 path to local file path
     * If path is already local, return as-is
     * If path is S3 (s3://...), we need to note that RAG service expects local path
     *
     * NOTE: This method doesn't actually download the file.
     * The file should be downloaded by the caller (DocumentsService) before calling RAG service.
     * This is because RagServiceClient shouldn't depend on storage provider.
     *
     * @param filePath - Can be S3 path (s3://bucket/key) or local path
     * @returns Local file path (or original if already local)
     */
    private convertS3ToLocalPath(filePath: string): string {
        // If it's already a local path, return as-is
        if (!filePath.startsWith('s3://')) {
            return filePath;
        }

        // If it's S3 path, RAG service cannot read it directly
        // The caller should download the file first and pass local path
        // For now, we'll throw an error to make it clear
        throw new Error(
            `S3 paths are not supported. Please download the file from S3 first and provide a local path. ` +
            `Received: ${filePath}`,
        );
    }
}

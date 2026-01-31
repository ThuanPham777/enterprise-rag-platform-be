import {
    Injectable,
    BadRequestException,
    NotFoundException,
    Logger,
    Inject,
} from '@nestjs/common';
import type { IStorageProvider } from './interfaces/storage-provider.interface';
import { FileValidationService } from './services/file-validation.service';
import { GeneratePresignedUrlRequestDto } from './dto/request/generate-presigned-url-request.dto';
import { PresignedUrlResponseDto } from './dto/response/presigned-url-response.dto';
import { DeleteFileRequestDto } from './dto/request/delete-file-request.dto';
import { GetFileUrlRequestDto } from './dto/request/get-file-url-request.dto';
import { STORAGE_PROVIDER_TOKEN } from './constants/storage-provider.token';

@Injectable()
export class UploadsService {
    private readonly logger = new Logger(UploadsService.name);

    constructor(
        @Inject(STORAGE_PROVIDER_TOKEN)
        private readonly storageProvider: IStorageProvider,
        private readonly fileValidationService: FileValidationService,
    ) { }

    /**
     * Generate presigned URL for file upload
     */
    async generatePresignedUploadUrl(
        userId: string,
        dto: GeneratePresignedUrlRequestDto,
    ): Promise<PresignedUrlResponseDto> {
        // Validate file
        const validation = this.fileValidationService.validateFile({
            fileName: dto.fileName,
            mimeType: dto.mimeType,
            fileSize: dto.fileSize,
        });

        if (!validation.isValid) {
            throw new BadRequestException({
                message: 'File validation failed',
                errors: validation.errors,
            });
        }

        // Generate storage key
        const storageKey = this.fileValidationService.generateStorageKey(
            userId,
            validation.sanitizedFileName,
            dto.folder,
        );

        // Generate presigned URL
        const presignedUrl = await this.storageProvider.generatePresignedUploadUrl({
            key: storageKey,
            contentType: dto.mimeType,
            expiresIn: dto.expiresIn,
            metadata: {
                originalFileName: dto.fileName,
                uploadedBy: userId,
                uploadedAt: new Date().toISOString(),
            },
        });

        this.logger.log(
            `Presigned upload URL generated for user ${userId}, file: ${storageKey}`,
        );

        return {
            uploadUrl: presignedUrl.uploadUrl,
            key: presignedUrl.key,
            expiresAt: presignedUrl.expiresAt,
            fileName: validation.sanitizedFileName,
        };
    }

    /**
     * Generate presigned URL for file download/access
     */
    async generatePresignedDownloadUrl(
        userId: string,
        dto: GetFileUrlRequestDto,
    ): Promise<{ url: string; expiresAt: Date }> {
        // Verify file exists
        const exists = await this.storageProvider.fileExists(dto.key);
        if (!exists) {
            throw new NotFoundException('File not found');
        }

        // TODO: Add authorization check - verify user has access to this file
        // This could check database records, permissions, etc.

        const url = await this.storageProvider.generatePresignedDownloadUrl({
            key: dto.key,
            expiresIn: dto.expiresIn,
        });

        const expiresIn = dto.expiresIn || 3600;
        const expiresAt = new Date(Date.now() + expiresIn * 1000);

        this.logger.log(
            `Presigned download URL generated for user ${userId}, file: ${dto.key}`,
        );

        return { url, expiresAt };
    }

    /**
     * Delete a file from storage
     */
    async deleteFile(userId: string, dto: DeleteFileRequestDto): Promise<void> {
        // Verify file exists
        const exists = await this.storageProvider.fileExists(dto.key);
        if (!exists) {
            throw new NotFoundException('File not found');
        }

        // TODO: Add authorization check - verify user has permission to delete this file

        await this.storageProvider.deleteFile({ key: dto.key });

        this.logger.log(`File deleted by user ${userId}: ${dto.key}`);
    }

    /**
     * Check if file exists
     */
    async fileExists(key: string): Promise<boolean> {
        return await this.storageProvider.fileExists(key);
    }

    /**
     * Upload file directly to storage
     */
    async uploadFile(
        userId: string,
        file: {
            originalname: string;
            mimetype: string;
            size: number;
            buffer: Buffer;
        },
        folder?: string,
    ): Promise<{
        key: string;
        publicUrl?: string;
        fileName: string;
        size: number;
        mimeType: string;
    }> {
        // Validate file
        const validation = this.fileValidationService.validateFile({
            fileName: file.originalname,
            mimeType: file.mimetype,
            fileSize: file.size,
        });

        if (!validation.isValid) {
            throw new BadRequestException({
                message: 'File validation failed',
                errors: validation.errors,
            });
        }

        // Generate storage key
        const storageKey = this.fileValidationService.generateStorageKey(
            userId,
            validation.sanitizedFileName,
            folder,
        );

        // Upload to storage
        const result = await this.storageProvider.uploadFile({
            file: file.buffer,
            key: storageKey,
            contentType: file.mimetype,
            metadata: {
                originalFileName: file.originalname,
                uploadedBy: userId,
                uploadedAt: new Date().toISOString(),
            },
        });

        this.logger.log(
            `File uploaded by user ${userId}, file: ${storageKey}, size: ${result.size} bytes`,
        );

        return {
            key: result.key,
            fileName: validation.sanitizedFileName,
            size: result.size,
            mimeType: file.mimetype,
        };
    }
}

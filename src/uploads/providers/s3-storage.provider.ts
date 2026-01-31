import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';
import {
    IStorageProvider,
    PresignedUrlOptions,
    PresignedUrlResponse,
    DeleteFileOptions,
    GetFileUrlOptions,
    UploadFileOptions,
    UploadFileResponse,
    DownloadFileOptions,
    DownloadFileResponse,
} from '../interfaces/storage-provider.interface';

@Injectable()
export class S3StorageProvider implements IStorageProvider {
    private readonly logger = new Logger(S3StorageProvider.name);
    private readonly s3Client: S3Client;
    private readonly bucketName: string;
    private readonly region: string;

    constructor(private configService: ConfigService) {
        this.region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
        this.bucketName =
            this.configService.get<string>('AWS_S3_BUCKET_NAME') || '';

        // Initialize S3 client
        this.s3Client = new S3Client({
            region: this.region,
            credentials: {
                accessKeyId:
                    this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
                secretAccessKey:
                    this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
            },
        });

        if (!this.bucketName) {
            this.logger.warn('AWS_S3_BUCKET_NAME is not configured');
        }
    }

    async generatePresignedUploadUrl(
        options: PresignedUrlOptions,
    ): Promise<PresignedUrlResponse> {
        const expiresIn = options.expiresIn || 3600; // Default 1 hour
        const expiresAt = new Date(Date.now() + expiresIn * 1000);

        // Sanitize metadata for presigned URLs as well
        const sanitizedMetadata = options.metadata
            ? this.sanitizeMetadata(options.metadata)
            : {};

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: options.key,
            ContentType: options.contentType,
            Metadata: sanitizedMetadata,
        });

        try {
            const uploadUrl = await getSignedUrl(this.s3Client, command, {
                expiresIn,
            });

            return {
                uploadUrl,
                key: options.key,
                expiresAt,
            };
        } catch (error) {
            this.logger.error('Failed to generate presigned upload URL', error);
            throw new Error('Failed to generate presigned upload URL');
        }
    }

    async generatePresignedDownloadUrl(
        options: GetFileUrlOptions,
    ): Promise<string> {
        const expiresIn = options.expiresIn || 3600; // Default 1 hour

        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: options.key,
        });

        try {
            return await getSignedUrl(this.s3Client, command, { expiresIn });
        } catch (error) {
            this.logger.error('Failed to generate presigned download URL', error);
            throw new Error('Failed to generate presigned download URL');
        }
    }

    async deleteFile(options: DeleteFileOptions): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: options.key,
        });

        try {
            await this.s3Client.send(command);
            this.logger.log(`File deleted: ${options.key}`);
        } catch (error) {
            this.logger.error('Failed to delete file', error);
            throw new Error('Failed to delete file');
        }
    }

    async fileExists(key: string): Promise<boolean> {
        const command = new HeadObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });

        try {
            await this.s3Client.send(command);
            return true;
        } catch (error: any) {
            if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
                return false;
            }
            this.logger.error('Error checking file existence', error);
            throw error;
        }
    }

    /**
     * Sanitize metadata values to ensure they are ASCII-safe
     * AWS S3 metadata values must be ASCII characters only
     * This prevents SignatureDoesNotMatch errors with special characters
     */
    private sanitizeMetadata(metadata: Record<string, string>): Record<string, string> {
        const sanitized: Record<string, string> = {};
        for (const [key, value] of Object.entries(metadata)) {
            // AWS S3 metadata keys must be lowercase and ASCII
            const sanitizedKey = key.toLowerCase().replace(/[^a-z0-9_-]/g, '_');

            // Check if value contains only ASCII characters
            const isAscii = /^[\x00-\x7F]*$/.test(value);

            if (isAscii) {
                // Safe to use as-is
                sanitized[sanitizedKey] = value;
            } else {
                // For non-ASCII values, we have two options:
                // 1. Skip the metadata field (safest)
                // 2. Encode as base64 (preserves data but less readable)
                // We'll skip to avoid signature issues
                this.logger.warn(
                    `Skipping metadata field '${key}' due to non-ASCII characters`,
                );
            }
        }
        return sanitized;
    }

    async uploadFile(options: UploadFileOptions): Promise<UploadFileResponse> {
        // Sanitize metadata to ensure ASCII compliance
        const sanitizedMetadata = options.metadata
            ? this.sanitizeMetadata(options.metadata)
            : {};

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: options.key,
            Body: options.file,
            ContentType: options.contentType,
            Metadata: sanitizedMetadata,
        });

        try {
            await this.s3Client.send(command);
            const size = Buffer.isBuffer(options.file)
                ? options.file.length
                : typeof options.file === 'string'
                    ? Buffer.from(options.file).length
                    : options.file.length;

            this.logger.log(`File uploaded successfully: ${options.key}`);

            return {
                key: options.key,
                size,
            };
        } catch (error) {
            this.logger.error('Failed to upload file', error);
            throw new Error('Failed to upload file to storage');
        }
    }

    /**
     * Download file from S3 to local path
     * Supports both s3://bucket/key format and direct key format
     */
    async downloadFile(
        options: DownloadFileOptions,
    ): Promise<DownloadFileResponse> {
        // Parse S3 path - support both s3://bucket/key and direct key
        let key = options.key;
        if (key.startsWith('s3://')) {
            // Extract key from s3://bucket/key format
            const parts = key.replace('s3://', '').split('/');
            const bucket = parts[0];
            key = parts.slice(1).join('/');

            // Verify bucket matches configured bucket
            if (bucket !== this.bucketName) {
                throw new Error(
                    `Bucket mismatch: expected ${this.bucketName}, got ${bucket}`,
                );
            }
        }

        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });

        try {
            // Ensure directory exists
            const dir = path.dirname(options.localPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Download file
            const response = await this.s3Client.send(command);
            const chunks: Uint8Array[] = [];

            // Handle stream
            if (response.Body) {
                for await (const chunk of response.Body as any) {
                    chunks.push(chunk);
                }
            }

            const buffer = Buffer.concat(chunks);
            fs.writeFileSync(options.localPath, buffer);

            this.logger.log(
                `File downloaded from S3: ${key} -> ${options.localPath}`,
            );

            return {
                localPath: options.localPath,
                size: buffer.length,
            };
        } catch (error) {
            this.logger.error('Failed to download file from S3', error);
            throw new Error('Failed to download file from storage');
        }
    }
}

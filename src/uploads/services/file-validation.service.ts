import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface FileValidationOptions {
    /** Original file name */
    fileName: string;
    /** MIME type */
    mimeType: string;
    /** File size in bytes */
    fileSize: number;
    /** Allowed MIME types (if not provided, uses default document types) */
    allowedMimeTypes?: string[];
    /** Maximum file size in bytes (if not provided, uses config default) */
    maxFileSize?: number;
}

export interface FileValidationResult {
    /** Whether file is valid */
    isValid: boolean;
    /** Validation errors (if any) */
    errors: string[];
    /** Sanitized file name */
    sanitizedFileName: string;
    /** Detected file extension */
    fileExtension: string;
}

/**
 * Service for validating file uploads with security rules
 */
@Injectable()
export class FileValidationService {
    // Default allowed document MIME types
    private readonly defaultAllowedMimeTypes = [
        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
        'application/rtf',
        'text/plain',
        'text/csv',
        // Images (for document previews)
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        // Archives
        'application/zip',
        'application/x-zip-compressed',
        'application/x-rar-compressed',
        'application/x-7z-compressed',
    ];

    // File extension to MIME type mapping
    private readonly extensionToMimeType: Record<string, string> = {
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ppt: 'application/vnd.ms-powerpoint',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        rtf: 'application/rtf',
        txt: 'text/plain',
        csv: 'text/csv',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        zip: 'application/zip',
        rar: 'application/x-rar-compressed',
        '7z': 'application/x-7z-compressed',
    };

    constructor(private configService: ConfigService) { }

    /**
     * Validate file before upload
     */
    validateFile(options: FileValidationOptions): FileValidationResult {
        const errors: string[] = [];
        const allowedMimeTypes =
            options.allowedMimeTypes || this.defaultAllowedMimeTypes;
        const maxFileSize =
            options.maxFileSize ||
            this.configService.get<number>('MAX_FILE_SIZE_BYTES') ||
            50 * 1024 * 1024; // Default 50MB

        // Extract file extension
        const fileExtension = this.extractFileExtension(options.fileName);

        // Validate file extension
        if (!fileExtension) {
            errors.push('File must have a valid extension');
        }

        // Validate MIME type
        if (!allowedMimeTypes.includes(options.mimeType)) {
            errors.push(
                `File type '${options.mimeType}' is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`,
            );
        }

        // Validate file size
        if (options.fileSize > maxFileSize) {
            const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(2);
            errors.push(
                `File size exceeds maximum allowed size of ${maxSizeMB}MB`,
            );
        }

        // Validate file name
        if (!options.fileName || options.fileName.trim().length === 0) {
            errors.push('File name is required');
        }

        // Sanitize file name
        const sanitizedFileName = this.sanitizeFileName(
            options.fileName,
            fileExtension,
        );

        return {
            isValid: errors.length === 0,
            errors,
            sanitizedFileName,
            fileExtension: fileExtension.toLowerCase(),
        };
    }

    /**
     * Extract file extension from file name
     */
    private extractFileExtension(fileName: string): string {
        const lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex === -1 || lastDotIndex === fileName.length - 1) {
            return '';
        }
        return fileName.substring(lastDotIndex + 1);
    }

    /**
     * Sanitize file name to prevent path traversal and other security issues
     */
    private sanitizeFileName(fileName: string, extension: string): string {
        // Remove path separators and dangerous characters
        let sanitized = fileName
            .replace(/[\/\\]/g, '') // Remove path separators
            .replace(/[<>:"|?*]/g, '') // Remove dangerous characters
            .trim();

        // Remove extension if present
        if (sanitized.toLowerCase().endsWith(`.${extension.toLowerCase()}`)) {
            sanitized = sanitized.substring(
                0,
                sanitized.length - extension.length - 1,
            );
        }

        // Limit length (max 255 characters including extension)
        const maxNameLength = 255 - extension.length - 1;
        if (sanitized.length > maxNameLength) {
            sanitized = sanitized.substring(0, maxNameLength);
        }

        // If empty after sanitization, use default name
        if (!sanitized) {
            sanitized = 'file';
        }

        // Add timestamp to ensure uniqueness
        const timestamp = Date.now();
        return `${sanitized}_${timestamp}.${extension}`;
    }

    /**
     * Generate a safe storage key for the file
     */
    generateStorageKey(
        userId: string,
        fileName: string,
        folder?: string,
    ): string {
        const sanitized = this.sanitizeFileName(
            fileName,
            this.extractFileExtension(fileName),
        );

        // Create folder structure: folder/userId/timestamp_filename.ext
        const parts = [folder || 'documents', userId, sanitized];
        return parts.join('/');
    }

    /**
     * Get MIME type from file extension
     */
    getMimeTypeFromExtension(extension: string): string | null {
        return this.extensionToMimeType[extension.toLowerCase()] || null;
    }
}

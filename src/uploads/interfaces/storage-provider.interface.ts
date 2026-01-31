/**
 * Storage Provider Interface
 *
 * Abstract interface for storage providers to enable easy switching
 * between different storage solutions (S3, Azure Blob, Google Cloud Storage, etc.)
 */
export interface PresignedUrlOptions {
    /** File name/key in storage */
    key: string;
    /** MIME type of the file */
    contentType: string;
    /** Expiration time in seconds (default: 3600 = 1 hour) */
    expiresIn?: number;
    /** Additional metadata */
    metadata?: Record<string, string>;
}

export interface PresignedUrlResponse {
    /** Presigned URL for uploading */
    uploadUrl: string;
    /** File key/path in storage */
    key: string;
    /** Expiration timestamp */
    expiresAt: Date;
}

export interface DeleteFileOptions {
    /** File key/path in storage */
    key: string;
}

export interface GetFileUrlOptions {
    /** File key/path in storage */
    key: string;
    /** Expiration time in seconds for signed URL */
    expiresIn?: number;
}

export interface UploadFileOptions {
    /** File buffer or stream */
    file: Buffer | Uint8Array | string;
    /** File name/key in storage */
    key: string;
    /** MIME type of the file */
    contentType: string;
    /** Additional metadata */
    metadata?: Record<string, string>;
}

export interface UploadFileResponse {
    /** File key/path in storage */
    key: string;
    /** File size in bytes */
    size: number;
}

/**
 * Abstract storage provider interface
 */
export interface IStorageProvider {
    /**
     * Generate a presigned URL for uploading a file
     */
    generatePresignedUploadUrl(
        options: PresignedUrlOptions,
    ): Promise<PresignedUrlResponse>;

    /**
     * Generate a presigned URL for downloading/accessing a file
     */
    generatePresignedDownloadUrl(
        options: GetFileUrlOptions,
    ): Promise<string>;

    /**
     * Delete a file from storage
     */
    deleteFile(options: DeleteFileOptions): Promise<void>;

    /**
     * Check if a file exists in storage
     */
    fileExists(key: string): Promise<boolean>;

    /**
     * Upload a file directly to storage
     */
    uploadFile(options: UploadFileOptions): Promise<UploadFileResponse>;
}

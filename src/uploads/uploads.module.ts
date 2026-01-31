import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { S3StorageProvider } from './providers/s3-storage.provider';
import { FileValidationService } from './services/file-validation.service';
import { STORAGE_PROVIDER_TOKEN } from './constants/storage-provider.token';

@Module({
    imports: [ConfigModule],
    controllers: [UploadsController],
    providers: [
        FileValidationService,
        S3StorageProvider,
        {
            // Use dependency injection to easily switch storage providers
            // To switch to another provider, just change this provider
            // Example: useClass: AzureBlobStorageProvider
            provide: STORAGE_PROVIDER_TOKEN,
            useExisting: S3StorageProvider,
        },
        UploadsService,
    ],
    exports: [UploadsService, STORAGE_PROVIDER_TOKEN],
})
export class UploadsModule { }

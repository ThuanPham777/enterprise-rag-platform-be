import {
    Controller,
    Post,
    Get,
    Delete,
    Body,
    UseGuards,
    Req,
    HttpCode,
    HttpStatus,
    UseInterceptors,
    UploadedFile,
    Query,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiProperty,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ApiResponseDto } from '../common/dtos/api-response.dto';
import { ErrorResponseDto } from '../common/dtos/error-response.dto';
import { GeneratePresignedUrlRequestDto } from './dto/request/generate-presigned-url-request.dto';
import { PresignedUrlResponseDto } from './dto/response/presigned-url-response.dto';
import { DeleteFileRequestDto } from './dto/request/delete-file-request.dto';
import { GetFileUrlRequestDto } from './dto/request/get-file-url-request.dto';
import { UploadFileResponseDto } from './dto/response/upload-file-response.dto';
import { UploadFolder } from './dto/request/generate-presigned-url-request.dto';
import type { Request } from 'express';

@ApiTags('Uploads')
@ApiBearerAuth('access-token')
@Controller('uploads')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UploadsController {
    constructor(private readonly uploadsService: UploadsService) { }

    @Permissions('UPLOAD_DOCUMENTS')
    @Post()
    @UseInterceptors(FileInterceptor('file'))
    @HttpCode(HttpStatus.CREATED)
    @ApiConsumes('multipart/form-data')
    @ApiOperation({
        summary: 'Upload file directly',
        description:
            'Upload a file directly from your local machine. The file will be validated and uploaded to storage. This is the simplest way to upload files.',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'File to upload',
                },
                folder: {
                    type: 'string',
                    enum: ['documents', 'images', 'temp'],
                    description: 'Optional folder/category for the upload',
                },
            },
            required: ['file'],
        },
    })
    @ApiResponse({
        status: 201,
        description: 'File uploaded successfully',
        type: UploadFileResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Validation error or invalid file',
        type: ErrorResponseDto,
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
        type: ErrorResponseDto,
    })
    async uploadFile(
        @Req() req: Request,
        @UploadedFile() file: any,
        @Query('folder') folder?: UploadFolder,
    ): Promise<ApiResponseDto<UploadFileResponseDto>> {
        if (!file) {
            throw new Error('No file provided');
        }

        const userId = (req as any).user.userId;
        const result = await this.uploadsService.uploadFile(userId, file, folder);
        return ApiResponseDto.success(result, 'File uploaded successfully');
    }

    @Permissions('UPLOAD_DOCUMENTS')
    @Post('presigned-url')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Generate presigned URL for file upload',
        description:
            'Generate a presigned URL that allows direct upload to S3 without going through the server. The URL is time-limited and secure.',
    })
    @ApiBody({ type: GeneratePresignedUrlRequestDto })
    @ApiResponse({
        status: 200,
        description: 'Presigned URL generated successfully',
        type: PresignedUrlResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Validation error or invalid file',
        type: ErrorResponseDto,
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
        type: ErrorResponseDto,
    })
    async generatePresignedUrl(
        @Req() req: Request,
        @Body() dto: GeneratePresignedUrlRequestDto,
    ): Promise<ApiResponseDto<PresignedUrlResponseDto>> {
        const userId = (req as any).user.userId;
        const result = await this.uploadsService.generatePresignedUploadUrl(
            userId,
            dto,
        );
        return ApiResponseDto.success(
            result,
            'Presigned URL generated successfully',
        );
    }

    @Permissions('VIEW_DOCUMENTS')
    @Post('download-url')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Generate presigned URL for file download',
        description:
            'Generate a presigned URL for downloading/accessing an existing file from storage.',
    })
    @ApiBody({ type: GetFileUrlRequestDto })
    @ApiResponse({
        status: 200,
        description: 'Download URL generated successfully',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string', example: 'success' },
                message: { type: 'string', example: 'Download URL generated successfully' },
                data: {
                    type: 'object',
                    properties: {
                        url: { type: 'string', example: 'https://s3.amazonaws.com/...' },
                        expiresAt: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
                    },
                },
            },
        },
    })
    @ApiResponse({
        status: 404,
        description: 'File not found',
        type: ErrorResponseDto,
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
        type: ErrorResponseDto,
    })
    async generateDownloadUrl(
        @Req() req: Request,
        @Body() dto: GetFileUrlRequestDto,
    ): Promise<ApiResponseDto<{ url: string; expiresAt: Date }>> {
        const userId = (req as any).user.userId;
        const result = await this.uploadsService.generatePresignedDownloadUrl(
            userId,
            dto,
        );
        return ApiResponseDto.success(
            result,
            'Download URL generated successfully',
        );
    }

    @Permissions('DELETE_DOCUMENTS')
    @Delete()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Delete a file from storage',
        description: 'Delete a file from storage by its key/path.',
    })
    @ApiBody({ type: DeleteFileRequestDto })
    @ApiResponse({
        status: 200,
        description: 'File deleted successfully',
        type: ApiResponseDto,
    })
    @ApiResponse({
        status: 404,
        description: 'File not found',
        type: ErrorResponseDto,
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
        type: ErrorResponseDto,
    })
    async deleteFile(
        @Req() req: Request,
        @Body() dto: DeleteFileRequestDto,
    ): Promise<ApiResponseDto<null>> {
        const userId = (req as any).user.userId;
        await this.uploadsService.deleteFile(userId, dto);
        return ApiResponseDto.success(null, 'File deleted successfully');
    }
}

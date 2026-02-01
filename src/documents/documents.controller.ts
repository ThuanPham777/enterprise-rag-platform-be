import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ApiResponseDto } from '../common/dtos/api-response.dto';
import { ErrorResponseDto } from '../common/dtos/error-response.dto';
import { CreateDocumentRequestDto } from './dto/request/create-document-request.dto';
import { UpdateDocumentRequestDto } from './dto/request/update-document-request.dto';
import { CreateDocumentResponseDto } from './dto/response/create-document-response.dto';
import { DocumentResponseDto } from './dto/response/document-response.dto';
import type { Request } from 'express';

@ApiTags('Documents')
@ApiBearerAuth('access-token')
@Controller('documents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Permissions('UPLOAD_DOCUMENTS')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new document',
    description:
      'Create a new document with access rules. The document will be created with PROCESSING status and RAG ingestion will be triggered asynchronously.',
  })
  @ApiBody({ type: CreateDocumentRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Document created successfully',
    type: CreateDocumentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or invalid access rules',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async createDocument(
    @Req() req: Request,
    @Body() dto: CreateDocumentRequestDto,
  ): Promise<ApiResponseDto<CreateDocumentResponseDto>> {
    const userId = (req as any).user.userId;
    const result = await this.documentsService.create(userId, dto);
    return ApiResponseDto.success(result, 'Document created successfully');
  }

  @Permissions('VIEW_DOCUMENTS')
  @Get()
  @ApiOperation({
    summary: 'Get all documents',
    description: 'Retrieve all documents with their access rules',
  })
  @ApiResponse({
    status: 200,
    description: 'Documents retrieved successfully',
    type: DocumentResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getDocuments(): Promise<ApiResponseDto<DocumentResponseDto[]>> {
    const documents = await this.documentsService.findAll();
    return ApiResponseDto.success(documents);
  }

  @Permissions('VIEW_DOCUMENTS')
  @Get(':id')
  @ApiOperation({
    summary: 'Get document by ID',
    description: 'Retrieve a specific document by ID with access rules',
  })
  @ApiParam({
    name: 'id',
    description: 'Document ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Document retrieved successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getDocument(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<DocumentResponseDto>> {
    const document = await this.documentsService.findOne(id);
    return ApiResponseDto.success(document);
  }

  @Permissions('UPLOAD_DOCUMENTS')
  @Put(':id')
  @ApiOperation({
    summary: 'Update document',
    description: 'Update document title and/or access rules',
  })
  @ApiParam({
    name: 'id',
    description: 'Document ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateDocumentRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Document updated successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or invalid access rules',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async updateDocument(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentRequestDto,
  ): Promise<ApiResponseDto<DocumentResponseDto>> {
    const document = await this.documentsService.update(id, dto);
    return ApiResponseDto.success(document, 'Document updated successfully');
  }

  @Permissions('DELETE_DOCUMENTS')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete document',
    description: 'Delete a document and its access rules',
  })
  @ApiParam({
    name: 'id',
    description: 'Document ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Document deleted successfully',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async deleteDocument(@Param('id') id: string): Promise<ApiResponseDto<null>> {
    await this.documentsService.delete(id);
    return ApiResponseDto.success(null, 'Document deleted successfully');
  }
}

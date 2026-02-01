import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { EmbeddingJobsService } from './embedding-jobs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ApiResponseDto } from '../common/dtos/api-response.dto';
import { ErrorResponseDto } from '../common/dtos/error-response.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { EmbeddingJobResponseDto } from './dto/response/embedding-job-response.dto';
import { EmbeddingJobStatus } from './enums/embedding-job-status.enum';

@ApiTags('Embedding Jobs')
@ApiBearerAuth('access-token')
@Controller('embedding-jobs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EmbeddingJobsController {
  constructor(private embeddingJobsService: EmbeddingJobsService) {}

  @Permissions('MANAGE_DOCUMENTS')
  @Get()
  @ApiOperation({
    summary: 'List all embedding jobs',
    description: 'Retrieve all embedding jobs in the system',
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter by status',
    required: false,
    enum: EmbeddingJobStatus,
  })
  @ApiResponse({
    status: 200,
    description: 'Embedding jobs retrieved successfully',
    type: EmbeddingJobResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getEmbeddingJobs(
    @Query('status') status?: EmbeddingJobStatus,
  ): Promise<ApiResponseDto<EmbeddingJobResponseDto[]>> {
    let jobs: EmbeddingJobResponseDto[];

    if (status) {
      jobs = await this.embeddingJobsService.findByStatus(status);
    } else {
      jobs = await this.embeddingJobsService.findAll();
    }

    return ApiResponseDto.success(jobs);
  }

  @Permissions('MANAGE_DOCUMENTS')
  @Get(':id')
  @ApiOperation({
    summary: 'Get embedding job by ID',
    description: 'Retrieve a specific embedding job by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Embedding job ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Embedding job retrieved successfully',
    type: EmbeddingJobResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Embedding job not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getEmbeddingJob(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<EmbeddingJobResponseDto>> {
    const job = await this.embeddingJobsService.findById(id);
    return ApiResponseDto.success(job);
  }

  @Permissions('MANAGE_DOCUMENTS')
  @Get('document/:documentId')
  @ApiOperation({
    summary: 'Get embedding jobs by document ID',
    description: 'Retrieve all embedding jobs for a specific document',
  })
  @ApiParam({
    name: 'documentId',
    description: 'Document ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Embedding jobs retrieved successfully',
    type: EmbeddingJobResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getEmbeddingJobsByDocument(
    @Param('documentId') documentId: string,
  ): Promise<ApiResponseDto<EmbeddingJobResponseDto[]>> {
    const jobs = await this.embeddingJobsService.findByDocumentId(documentId);
    return ApiResponseDto.success(jobs);
  }

  @Permissions('MANAGE_DOCUMENTS')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete embedding job',
    description: 'Delete an embedding job by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Embedding job ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 204,
    description: 'Embedding job deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Embedding job not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async deleteEmbeddingJob(@Param('id') id: string): Promise<void> {
    await this.embeddingJobsService.delete(id);
  }
}

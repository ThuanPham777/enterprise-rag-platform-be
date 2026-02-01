import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
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
  ApiQuery,
} from '@nestjs/swagger';
import { DataSourcesService } from './data-sources.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ApiResponseDto } from '../common/dtos/api-response.dto';
import { ErrorResponseDto } from '../common/dtos/error-response.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CreateDataSourceRequestDto } from './dto/request/create-data-source-request.dto';
import { UpdateDataSourceRequestDto } from './dto/request/update-data-source-request.dto';
import { DataSourceResponseDto } from './dto/response/data-source-response.dto';
import { DataSourceType } from './enums';

@ApiTags('Data Sources')
@ApiBearerAuth('access-token')
@Controller('data-sources')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DataSourcesController {
  constructor(private dataSourcesService: DataSourcesService) {}

  @Permissions('MANAGE_DATA_SOURCES')
  @Get()
  @ApiOperation({
    summary: 'List all data sources',
    description:
      'Retrieve all external knowledge source integrations (Notion, Slack, Google Drive, etc.)',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: DataSourceType,
    description: 'Filter by data source type',
  })
  @ApiResponse({
    status: 200,
    description: 'Data sources retrieved successfully',
    type: DataSourceResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getDataSources(
    @Query('type') type?: DataSourceType,
  ): Promise<ApiResponseDto<DataSourceResponseDto[]>> {
    const dataSources = type
      ? await this.dataSourcesService.findByType(type)
      : await this.dataSourcesService.findAll();
    return ApiResponseDto.success(dataSources);
  }

  @Permissions('MANAGE_DATA_SOURCES')
  @Get('statistics')
  @ApiOperation({
    summary: 'Get data sources statistics',
    description: 'Retrieve statistics about all data sources',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStatistics(): Promise<ApiResponseDto<any>> {
    const stats = await this.dataSourcesService.getStatistics();
    return ApiResponseDto.success(stats);
  }

  @Permissions('MANAGE_DATA_SOURCES')
  @Get(':id')
  @ApiOperation({
    summary: 'Get data source by ID',
    description:
      'Retrieve a specific external knowledge source integration by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Data source ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Data source retrieved successfully',
    type: DataSourceResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Data source not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getDataSource(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<DataSourceResponseDto>> {
    const dataSource = await this.dataSourcesService.findById(id);
    return ApiResponseDto.success(dataSource);
  }

  @Permissions('MANAGE_DATA_SOURCES')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new data source',
    description:
      'Create a new external knowledge source integration (e.g., Notion workspace, Slack channels)',
  })
  @ApiBody({ type: CreateDataSourceRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Data source created successfully',
    type: DataSourceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async createDataSource(
    @Body() dto: CreateDataSourceRequestDto,
  ): Promise<ApiResponseDto<DataSourceResponseDto>> {
    const dataSource = await this.dataSourcesService.create(dto);
    return ApiResponseDto.success(
      dataSource,
      'Data source created successfully',
    );
  }

  @Permissions('MANAGE_DATA_SOURCES')
  @Put(':id')
  @ApiOperation({
    summary: 'Update data source',
    description: 'Update an existing data source',
  })
  @ApiParam({
    name: 'id',
    description: 'Data source ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateDataSourceRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Data source updated successfully',
    type: DataSourceResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Data source not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async updateDataSource(
    @Param('id') id: string,
    @Body() dto: UpdateDataSourceRequestDto,
  ): Promise<ApiResponseDto<DataSourceResponseDto>> {
    const dataSource = await this.dataSourcesService.update(id, dto);
    return ApiResponseDto.success(
      dataSource,
      'Data source updated successfully',
    );
  }

  @Permissions('MANAGE_DATA_SOURCES')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete data source',
    description: 'Delete a data source by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Data source ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 204,
    description: 'Data source deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Data source not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async deleteDataSource(@Param('id') id: string): Promise<void> {
    await this.dataSourcesService.delete(id);
  }

  @Permissions('MANAGE_DATA_SOURCES')
  @Post(':id/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Trigger sync for data source',
    description:
      'Trigger a synchronization job to pull documents from the external source',
  })
  @ApiParam({
    name: 'id',
    description: 'Data source ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Sync triggered successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Data source not found',
    type: ErrorResponseDto,
  })
  async triggerSync(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<{ message: string; jobId?: string }>> {
    const result = await this.dataSourcesService.triggerSync(id);
    return ApiResponseDto.success(result);
  }

  @Permissions('MANAGE_DATA_SOURCES')
  @Post(':id/test-connection')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test data source connection',
    description:
      'Test the connection to the external knowledge source (verify credentials and connectivity)',
  })
  @ApiParam({
    name: 'id',
    description: 'Data source ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Connection test result',
  })
  @ApiResponse({
    status: 404,
    description: 'Data source not found',
    type: ErrorResponseDto,
  })
  async testConnection(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<{ success: boolean; message: string }>> {
    const result = await this.dataSourcesService.testConnection(id);
    return ApiResponseDto.success(result);
  }
}

import {
  Controller,
  Get,
  Delete,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { QueryLogsService } from './query-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ApiResponseDto } from '../common/dtos/api-response.dto';
import { ErrorResponseDto } from '../common/dtos/error-response.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { QueryLogResponseDto } from './dto/response/query-log-response.dto';
import { QueryLogFilterDto } from './dto/request/query-log-filter.dto';

@ApiTags('Query Logs')
@ApiBearerAuth('access-token')
@Controller('query-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class QueryLogsController {
  constructor(private queryLogsService: QueryLogsService) {}

  @Permissions('VIEW_ANALYTICS')
  @Get()
  @ApiOperation({
    summary: 'List all query logs',
    description: 'Retrieve all query logs with optional filters',
  })
  @ApiQuery({
    name: 'userId',
    description: 'Filter by user ID',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Filter logs after this date (ISO format)',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'endDate',
    description: 'Filter logs before this date (ISO format)',
    required: false,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Query logs retrieved successfully',
    type: QueryLogResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getQueryLogs(
    @Query() filter: QueryLogFilterDto,
  ): Promise<ApiResponseDto<QueryLogResponseDto[]>> {
    const logs = await this.queryLogsService.findAll(filter);
    return ApiResponseDto.success(logs);
  }

  @Permissions('VIEW_ANALYTICS')
  @Get('statistics')
  @ApiOperation({
    summary: 'Get query statistics',
    description:
      'Retrieve query statistics including totals, averages, and trends',
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Start date for statistics (ISO format)',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End date for statistics (ISO format)',
    required: false,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Query statistics retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ApiResponseDto<any>> {
    const stats = await this.queryLogsService.getStatistics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
    return ApiResponseDto.success(stats);
  }

  @Permissions('VIEW_ANALYTICS')
  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get query logs by user ID',
    description: 'Retrieve all query logs for a specific user',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Query logs retrieved successfully',
    type: QueryLogResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getQueryLogsByUser(
    @Param('userId') userId: string,
  ): Promise<ApiResponseDto<QueryLogResponseDto[]>> {
    const logs = await this.queryLogsService.findByUserId(userId);
    return ApiResponseDto.success(logs);
  }

  @Permissions('MANAGE_SYSTEM')
  @Delete('cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clean up old query logs',
    description: 'Delete query logs older than specified days (default: 90)',
  })
  @ApiQuery({
    name: 'daysToKeep',
    description: 'Number of days to keep logs',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Cleanup completed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async cleanupOldLogs(
    @Query('daysToKeep') daysToKeep?: number,
  ): Promise<ApiResponseDto<{ deletedCount: number }>> {
    const deletedCount = await this.queryLogsService.deleteOldLogs(
      daysToKeep || 90,
    );
    return ApiResponseDto.success(
      { deletedCount },
      `Deleted ${deletedCount} old query logs`,
    );
  }
}

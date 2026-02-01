import {
  Controller,
  Get,
  Post,
  Delete,
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
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { SystemLogsService } from './system-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ApiResponseDto } from '../common/dtos/api-response.dto';
import { ErrorResponseDto } from '../common/dtos/error-response.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { SystemLogResponseDto } from './dto/response/system-log-response.dto';
import { CreateSystemLogRequestDto } from './dto/request/create-system-log-request.dto';
import { SystemLogFilterDto } from './dto/request/system-log-filter.dto';
import { SystemLogLevel } from './enums/system-log-level.enum';

@ApiTags('System Logs')
@ApiBearerAuth('access-token')
@Controller('system-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SystemLogsController {
  constructor(private systemLogsService: SystemLogsService) {}

  @Permissions('VIEW_SYSTEM_LOGS')
  @Get()
  @ApiOperation({
    summary: 'List all system logs',
    description: 'Retrieve all system logs with optional filters',
  })
  @ApiQuery({
    name: 'level',
    description: 'Filter by log level',
    required: false,
    enum: SystemLogLevel,
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
  @ApiQuery({
    name: 'search',
    description: 'Search in log message',
    required: false,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'System logs retrieved successfully',
    type: SystemLogResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getSystemLogs(
    @Query() filter: SystemLogFilterDto,
  ): Promise<ApiResponseDto<SystemLogResponseDto[]>> {
    const logs = await this.systemLogsService.findAll(filter);
    return ApiResponseDto.success(logs);
  }

  @Permissions('VIEW_SYSTEM_LOGS')
  @Get('statistics')
  @ApiOperation({
    summary: 'Get system log statistics',
    description:
      'Retrieve system log statistics including totals and recent errors',
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
    description: 'System log statistics retrieved successfully',
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
    const stats = await this.systemLogsService.getStatistics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
    return ApiResponseDto.success(stats);
  }

  @Permissions('MANAGE_SYSTEM')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create system log',
    description: 'Create a new system log entry',
  })
  @ApiBody({ type: CreateSystemLogRequestDto })
  @ApiResponse({
    status: 201,
    description: 'System log created successfully',
    type: SystemLogResponseDto,
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
  async createSystemLog(
    @Body() dto: CreateSystemLogRequestDto,
  ): Promise<ApiResponseDto<SystemLogResponseDto>> {
    const log = await this.systemLogsService.create(dto);
    return ApiResponseDto.success(log, 'System log created successfully');
  }

  @Permissions('MANAGE_SYSTEM')
  @Delete('cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clean up old system logs',
    description: 'Delete system logs older than specified days (default: 30)',
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
    const deletedCount = await this.systemLogsService.deleteOldLogs(
      daysToKeep || 30,
    );
    return ApiResponseDto.success(
      { deletedCount },
      `Deleted ${deletedCount} old system logs`,
    );
  }

  @Permissions('MANAGE_SYSTEM')
  @Delete('level/:level')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete logs by level',
    description: 'Delete all system logs with a specific level',
  })
  @ApiQuery({
    name: 'level',
    description: 'Log level to delete',
    enum: SystemLogLevel,
  })
  @ApiResponse({
    status: 200,
    description: 'Logs deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async deleteByLevel(
    @Query('level') level: SystemLogLevel,
  ): Promise<ApiResponseDto<{ deletedCount: number }>> {
    const deletedCount = await this.systemLogsService.deleteByLevel(level);
    return ApiResponseDto.success(
      { deletedCount },
      `Deleted ${deletedCount} ${level} logs`,
    );
  }
}

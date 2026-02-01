import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateUUID } from '../common/utils/uuid.util';
import { SystemLogResponseDto } from './dto/response/system-log-response.dto';
import { CreateSystemLogRequestDto } from './dto/request/create-system-log-request.dto';
import { SystemLogFilterDto } from './dto/request/system-log-filter.dto';
import { SystemLogLevel } from './enums/system-log-level.enum';

@Injectable()
export class SystemLogsService {
  private readonly logger = new Logger(SystemLogsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new system log entry
   */
  async create(dto: CreateSystemLogRequestDto): Promise<SystemLogResponseDto> {
    const log = await this.prisma.system_logs.create({
      data: {
        id: generateUUID(),
        level: dto.level,
        message: dto.message,
        metadata: dto.metadata,
      },
    });

    return this.mapToResponseDto(log);
  }

  /**
   * Quick logging methods for internal use
   */
  async debug(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.create({
      level: SystemLogLevel.DEBUG,
      message,
      metadata,
    });
  }

  async info(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.create({
      level: SystemLogLevel.INFO,
      message,
      metadata,
    });
  }

  async warn(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.create({
      level: SystemLogLevel.WARN,
      message,
      metadata,
    });
  }

  async error(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.create({
      level: SystemLogLevel.ERROR,
      message,
      metadata,
    });
  }

  async fatal(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.create({
      level: SystemLogLevel.FATAL,
      message,
      metadata,
    });
  }

  /**
   * Get all system logs with optional filters
   */
  async findAll(filter?: SystemLogFilterDto): Promise<SystemLogResponseDto[]> {
    const where: any = {};

    if (filter?.level) {
      where.level = filter.level;
    }

    if (filter?.startDate || filter?.endDate) {
      where.created_at = {};
      if (filter.startDate) {
        where.created_at.gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        where.created_at.lte = new Date(filter.endDate);
      }
    }

    if (filter?.search) {
      where.message = {
        contains: filter.search,
        mode: 'insensitive',
      };
    }

    const logs = await this.prisma.system_logs.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 1000, // Limit to prevent performance issues
    });

    return logs.map((log) => this.mapToResponseDto(log));
  }

  /**
   * Get system logs by level
   */
  async findByLevel(level: SystemLogLevel): Promise<SystemLogResponseDto[]> {
    const logs = await this.prisma.system_logs.findMany({
      where: { level },
      orderBy: { created_at: 'desc' },
    });

    return logs.map((log) => this.mapToResponseDto(log));
  }

  /**
   * Get log statistics
   */
  async getStatistics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalLogs: number;
    logsByLevel: { level: string; count: number }[];
    recentErrors: SystemLogResponseDto[];
  }> {
    const where: any = {};

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at.gte = startDate;
      }
      if (endDate) {
        where.created_at.lte = endDate;
      }
    }

    // Total logs
    const totalLogs = await this.prisma.system_logs.count({ where });

    // Logs by level
    const levelCounts = await this.prisma.system_logs.groupBy({
      by: ['level'],
      where,
      _count: {
        level: true,
      },
    });

    const logsByLevel = levelCounts.map((lc) => ({
      level: lc.level || 'UNKNOWN',
      count: lc._count.level,
    }));

    // Recent errors (last 10)
    const recentErrorLogs = await this.prisma.system_logs.findMany({
      where: {
        level: {
          in: [SystemLogLevel.ERROR, SystemLogLevel.FATAL],
        },
      },
      orderBy: { created_at: 'desc' },
      take: 10,
    });

    const recentErrors = recentErrorLogs.map((log) =>
      this.mapToResponseDto(log),
    );

    return {
      totalLogs,
      logsByLevel,
      recentErrors,
    };
  }

  /**
   * Delete old logs (retention policy)
   */
  async deleteOldLogs(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.system_logs.deleteMany({
      where: {
        created_at: {
          lt: cutoffDate,
        },
      },
    });

    this.logger.log(
      `Deleted ${result.count} system logs older than ${daysToKeep} days`,
    );

    return result.count;
  }

  /**
   * Delete logs by level
   */
  async deleteByLevel(level: SystemLogLevel): Promise<number> {
    const result = await this.prisma.system_logs.deleteMany({
      where: { level },
    });

    this.logger.log(`Deleted ${result.count} ${level} system logs`);

    return result.count;
  }

  private mapToResponseDto(log: any): SystemLogResponseDto {
    return {
      id: log.id,
      level: log.level as SystemLogLevel,
      message: log.message || undefined,
      metadata: log.metadata || undefined,
      createdAt: log.created_at || undefined,
    };
  }
}

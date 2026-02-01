import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateUUID } from '../common/utils/uuid.util';
import { QueryLogResponseDto } from './dto/response/query-log-response.dto';
import { QueryLogFilterDto } from './dto/request/query-log-filter.dto';

@Injectable()
export class QueryLogsService {
  private readonly logger = new Logger(QueryLogsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new query log entry
   */
  async create(
    userId: string,
    question: string,
    responseTimeMs: number,
  ): Promise<QueryLogResponseDto> {
    const log = await this.prisma.query_logs.create({
      data: {
        id: generateUUID(),
        user_id: userId,
        question,
        response_time_ms: responseTimeMs,
      },
      include: {
        users: {
          select: {
            full_name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(
      `Query logged for user ${userId}: ${question.substring(0, 50)}... (${responseTimeMs}ms)`,
    );

    return this.mapToResponseDto(log);
  }

  /**
   * Get all query logs with optional filters
   */
  async findAll(filter?: QueryLogFilterDto): Promise<QueryLogResponseDto[]> {
    const where: any = {};

    if (filter?.userId) {
      where.user_id = filter.userId;
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

    const logs = await this.prisma.query_logs.findMany({
      where,
      include: {
        users: {
          select: {
            full_name: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 1000, // Limit to prevent performance issues
    });

    return logs.map((log) => this.mapToResponseDto(log));
  }

  /**
   * Get query logs by user ID
   */
  async findByUserId(userId: string): Promise<QueryLogResponseDto[]> {
    const logs = await this.prisma.query_logs.findMany({
      where: { user_id: userId },
      include: {
        users: {
          select: {
            full_name: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return logs.map((log) => this.mapToResponseDto(log));
  }

  /**
   * Get query statistics
   */
  async getStatistics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalQueries: number;
    averageResponseTimeMs: number;
    queriesByDay: { date: string; count: number }[];
    topUsers: { userId: string; userName: string; count: number }[];
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

    // Total queries
    const totalQueries = await this.prisma.query_logs.count({ where });

    // Average response time
    const avgResult = await this.prisma.query_logs.aggregate({
      where,
      _avg: {
        response_time_ms: true,
      },
    });
    const averageResponseTimeMs = Math.round(
      avgResult._avg.response_time_ms || 0,
    );

    // Queries by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyLogs = await this.prisma.query_logs.findMany({
      where: {
        created_at: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        created_at: true,
      },
    });

    const dailyCount: Record<string, number> = {};
    dailyLogs.forEach((log) => {
      if (log.created_at) {
        const dateStr = log.created_at.toISOString().split('T')[0];
        dailyCount[dateStr] = (dailyCount[dateStr] || 0) + 1;
      }
    });

    const queriesByDay = Object.entries(dailyCount)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top users
    const userCounts = await this.prisma.query_logs.groupBy({
      by: ['user_id'],
      where,
      _count: {
        user_id: true,
      },
      orderBy: {
        _count: {
          user_id: 'desc',
        },
      },
      take: 10,
    });

    const topUserIds = userCounts
      .filter((uc) => uc.user_id)
      .map((uc) => uc.user_id as string);

    const users = await this.prisma.users.findMany({
      where: { id: { in: topUserIds } },
      select: { id: true, full_name: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u.full_name]));

    const topUsers = userCounts
      .filter((uc) => uc.user_id)
      .map((uc) => ({
        userId: uc.user_id as string,
        userName: userMap.get(uc.user_id as string) || 'Unknown',
        count: uc._count.user_id,
      }));

    return {
      totalQueries,
      averageResponseTimeMs,
      queriesByDay,
      topUsers,
    };
  }

  /**
   * Delete old logs (retention policy)
   */
  async deleteOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.query_logs.deleteMany({
      where: {
        created_at: {
          lt: cutoffDate,
        },
      },
    });

    this.logger.log(
      `Deleted ${result.count} query logs older than ${daysToKeep} days`,
    );

    return result.count;
  }

  private mapToResponseDto(log: any): QueryLogResponseDto {
    return {
      id: log.id,
      userId: log.user_id || undefined,
      question: log.question || undefined,
      responseTimeMs: log.response_time_ms || undefined,
      createdAt: log.created_at || undefined,
      userName: log.users?.full_name || undefined,
      userEmail: log.users?.email || undefined,
    };
  }
}

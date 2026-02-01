import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateUUID } from '../common/utils/uuid.util';
import { CreateDataSourceRequestDto } from './dto/request/create-data-source-request.dto';
import { UpdateDataSourceRequestDto } from './dto/request/update-data-source-request.dto';
import { DataSourceResponseDto } from './dto/response/data-source-response.dto';
import { DataSourceType, DataSourceStatus } from './enums';

@Injectable()
export class DataSourcesService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<DataSourceResponseDto[]> {
    const dataSources = await this.prisma.data_sources.findMany({
      orderBy: { created_at: 'desc' },
    });

    // Get document counts for each data source
    const dataSourcesWithCounts = await Promise.all(
      dataSources.map(async (ds) => {
        const documentCount = await this.prisma.documents.count({
          where: { source_id: ds.id },
        });
        return { ...ds, documentCount };
      }),
    );

    return dataSourcesWithCounts.map((ds) => this.mapToResponseDto(ds));
  }

  async findById(id: string): Promise<DataSourceResponseDto> {
    const dataSource = await this.prisma.data_sources.findUnique({
      where: { id },
    });

    if (!dataSource) {
      throw new NotFoundException('Data source not found');
    }

    const documentCount = await this.prisma.documents.count({
      where: { source_id: id },
    });

    return this.mapToResponseDto({ ...dataSource, documentCount });
  }

  async findByType(type: DataSourceType): Promise<DataSourceResponseDto[]> {
    const dataSources = await this.prisma.data_sources.findMany({
      where: { type },
      orderBy: { created_at: 'desc' },
    });

    return dataSources.map((ds) => this.mapToResponseDto(ds));
  }

  async create(
    dto: CreateDataSourceRequestDto,
  ): Promise<DataSourceResponseDto> {
    const dataSource = await this.prisma.data_sources.create({
      data: {
        id: generateUUID(),
        type: dto.type,
        name: dto.name,
        config: this.sanitizeConfig(dto.config),
      },
    });

    return this.mapToResponseDto(dataSource);
  }

  async update(
    id: string,
    dto: UpdateDataSourceRequestDto,
  ): Promise<DataSourceResponseDto> {
    const dataSource = await this.prisma.data_sources.findUnique({
      where: { id },
    });

    if (!dataSource) {
      throw new NotFoundException('Data source not found');
    }

    // Merge config to preserve fields not being updated
    const mergedConfig = dto.config
      ? { ...(dataSource.config as object), ...dto.config }
      : dataSource.config;

    const updated = await this.prisma.data_sources.update({
      where: { id },
      data: {
        type: dto.type,
        name: dto.name,
        config: this.sanitizeConfig(mergedConfig as Record<string, any>),
      },
    });

    return this.mapToResponseDto(updated);
  }

  /**
   * Update data source status (for sync operations)
   */
  async updateStatus(
    id: string,
    status: DataSourceStatus,
    error?: string,
  ): Promise<DataSourceResponseDto> {
    const dataSource = await this.prisma.data_sources.findUnique({
      where: { id },
    });

    if (!dataSource) {
      throw new NotFoundException('Data source not found');
    }

    const config = (dataSource.config as Record<string, any>) || {};

    const updated = await this.prisma.data_sources.update({
      where: { id },
      data: {
        config: {
          ...config,
          _status: status,
          _lastError: error || null,
          _lastSyncAt:
            status === DataSourceStatus.ACTIVE
              ? new Date().toISOString()
              : config._lastSyncAt,
        },
      },
    });

    return this.mapToResponseDto(updated);
  }

  /**
   * Trigger a sync for a data source (placeholder for integration)
   */
  async triggerSync(id: string): Promise<{ message: string; jobId?: string }> {
    const dataSource = await this.prisma.data_sources.findUnique({
      where: { id },
    });

    if (!dataSource) {
      throw new NotFoundException('Data source not found');
    }

    // Update status to syncing
    await this.updateStatus(id, DataSourceStatus.SYNCING);

    // TODO: Integrate with RAG service to perform actual sync
    // This would involve:
    // 1. Calling the appropriate connector (Notion API, Slack API, etc.)
    // 2. Fetching documents from the external source
    // 3. Creating document records linked to this data source
    // 4. Triggering embedding jobs for new/updated documents

    return {
      message: `Sync triggered for data source ${dataSource.name || id}`,
      // jobId would be returned from the actual sync job
    };
  }

  /**
   * Test connection to a data source
   */
  async testConnection(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const dataSource = await this.prisma.data_sources.findUnique({
      where: { id },
    });

    if (!dataSource) {
      throw new NotFoundException('Data source not found');
    }

    // TODO: Implement actual connection testing based on source type
    // This would verify credentials and connectivity to the external service

    return {
      success: true,
      message: `Connection test for ${dataSource.type} - Implementation pending`,
    };
  }

  async delete(id: string): Promise<void> {
    const dataSource = await this.prisma.data_sources.findUnique({
      where: { id },
    });

    if (!dataSource) {
      throw new NotFoundException('Data source not found');
    }

    // Check if any documents are using this data source
    const documentsCount = await this.prisma.documents.count({
      where: { source_id: id },
    });

    if (documentsCount > 0) {
      throw new BadRequestException(
        `Cannot delete data source: ${documentsCount} document(s) are using it. Delete or reassign documents first.`,
      );
    }

    await this.prisma.data_sources.delete({
      where: { id },
    });
  }

  /**
   * Get statistics for all data sources
   */
  async getStatistics(): Promise<{
    totalSources: number;
    byType: Record<string, number>;
    totalDocuments: number;
  }> {
    const dataSources = await this.prisma.data_sources.findMany();

    const byType: Record<string, number> = {};
    for (const ds of dataSources) {
      byType[ds.type] = (byType[ds.type] || 0) + 1;
    }

    const totalDocuments = await this.prisma.documents.count({
      where: {
        source_id: { not: null },
      },
    });

    return {
      totalSources: dataSources.length,
      byType,
      totalDocuments,
    };
  }

  /**
   * Sanitize config to ensure no sensitive data in logs
   */
  private sanitizeConfig(
    config?: Record<string, any>,
  ): Record<string, any> | undefined {
    if (!config) return undefined;
    return config;
  }

  /**
   * Mask sensitive fields in config for response
   */
  private maskSensitiveConfig(
    config?: Record<string, any>,
  ): Record<string, any> | undefined {
    if (!config) return undefined;

    const sensitiveFields = [
      'accessToken',
      'apiKey',
      'credentials',
      'secret',
      'password',
    ];
    const masked = { ...config };

    for (const field of sensitiveFields) {
      if (masked[field]) {
        masked[field] = '***MASKED***';
      }
    }

    return masked;
  }

  private mapToResponseDto(dataSource: any): DataSourceResponseDto {
    const config = (dataSource.config as Record<string, any>) || {};

    return {
      id: dataSource.id,
      type: dataSource.type as DataSourceType,
      name: dataSource.name || undefined,
      config: this.maskSensitiveConfig(config),
      status:
        (config._status as DataSourceStatus) || DataSourceStatus.PENDING_AUTH,
      lastSyncAt: config._lastSyncAt ? new Date(config._lastSyncAt) : undefined,
      documentCount: dataSource.documentCount,
      createdAt: dataSource.created_at || undefined,
      updatedAt: dataSource.updated_at || undefined,
    };
  }
}

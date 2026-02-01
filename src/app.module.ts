import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permission.module';
import { DepartmentsModule } from './departments/departments.module';
import { PositionsModule } from './positions/positions.module';
import { UserProfilesModule } from './user-profiles/user-profiles.module';
import { UploadsModule } from './uploads/uploads.module';
import { DocumentsModule } from './documents/documents.module';
import { RagModule } from './rag/rag.module';
import { ChatsModule } from './chats/chats.module';
import { DataSourcesModule } from './data-sources/data-sources.module';
import { EmbeddingJobsModule } from './embedding-jobs/embedding-jobs.module';
import { QueryLogsModule } from './query-logs/query-logs.module';
import { SystemLogsModule } from './system-logs/system-logs.module';
import { AutoRefreshGuard } from './auth/guards/auto-refresh.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    DepartmentsModule,
    PositionsModule,
    UserProfilesModule,
    UploadsModule,
    RagModule,
    DocumentsModule,
    ChatsModule,
    DataSourcesModule,
    EmbeddingJobsModule,
    QueryLogsModule,
    SystemLogsModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AutoRefreshGuard,
    },
  ],
})
export class AppModule {}

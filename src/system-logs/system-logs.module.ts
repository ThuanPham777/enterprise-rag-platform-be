import { Module, Global } from '@nestjs/common';
import { SystemLogsController } from './system-logs.controller';
import { SystemLogsService } from './system-logs.service';
import { PrismaModule } from '../prisma/prisma.module';

@Global() // Make SystemLogsService available globally for logging throughout the app
@Module({
  imports: [PrismaModule],
  controllers: [SystemLogsController],
  providers: [SystemLogsService],
  exports: [SystemLogsService],
})
export class SystemLogsModule {}

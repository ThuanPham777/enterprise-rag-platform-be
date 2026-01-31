import { Module } from '@nestjs/common';
import { UserProfilesController } from './user-profiles.controller';
import { UserProfilesService } from './user-profiles.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UserProfilesController],
  providers: [UserProfilesService],
  exports: [UserProfilesService],
})
export class UserProfilesModule {}

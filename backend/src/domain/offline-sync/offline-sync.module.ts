import { Module } from '@nestjs/common';
import { EventBusModule } from '../../events/event-bus.module';
import { PrismaService } from '../../prisma/prisma.service';
import { OfflineSyncService } from './offline-sync.service';
import { OfflineSyncController } from './offline-sync.controller';

@Module({
  imports: [EventBusModule],
  controllers: [OfflineSyncController],
  providers: [OfflineSyncService, PrismaService],
  exports: [OfflineSyncService],
})
export class OfflineSyncModule {}

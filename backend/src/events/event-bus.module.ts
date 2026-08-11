import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { EventBusService } from './event-bus.service';
import { RealtimeController } from './realtime.controller';

@Module({
  imports: [CacheModule],
  controllers: [RealtimeController],
  providers: [EventBusService],
  exports: [EventBusService],
})
export class EventBusModule {}


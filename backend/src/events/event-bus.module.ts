import { Module } from '@nestjs/common';
import { EventBusService } from './event-bus.service';
import { RealtimeController } from './realtime.controller';

@Module({
  controllers: [RealtimeController],
  providers: [EventBusService],
  exports: [EventBusService],
})
export class EventBusModule {}

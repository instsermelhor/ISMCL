import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaClient } from '@prisma/client';
import { HealthController } from './health.controller';

import { MetricCollectorService } from './metric-collector.service';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [
    MetricCollectorService,
    { provide: PrismaClient, useValue: new PrismaClient() },
  ],
  exports: [MetricCollectorService],
})
export class HealthModule {}

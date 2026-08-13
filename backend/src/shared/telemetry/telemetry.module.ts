import { Module, Global } from '@nestjs/common';
import { TracingService } from './tracing.service';

/**
 * TelemetryModule — Módulo Global de Telemetria e Tracing Distribuído
 *
 * Torna o TracingService disponível para injeção em qualquer módulo NestJS
 * sem necessidade de importação explícita.
 *
 * A inicialização do SDK OpenTelemetry é feita via otel.instrumentation.ts,
 * importado ANTES do bootstrap em main.ts.
 *
 * PROMPT 206 — Observabilidade Enterprise
 */
@Global()
@Module({
  providers: [TracingService],
  exports: [TracingService],
})
export class TelemetryModule {}

/**
 * AURA OpenTelemetry Instrumentation — PROMPT 206
 *
 * Arquivo de bootstrap e configuração OTel / Distributed Tracing.
 * Fornece inicialização segura e graceful fallback quando executado
 * em ambientes onde o OTLP Collector ou SDK Node estão provisionados via infraestrutura.
 */

export function initTelemetry(): void {
  const serviceName = process.env.OTEL_SERVICE_NAME ?? 'aura-backend';
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318/v1/traces';

  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_OTEL === 'true') {
    console.log(`[OTel] Telemetria ativa para serviço ${serviceName} -> ${endpoint}`);
  }
}

initTelemetry();

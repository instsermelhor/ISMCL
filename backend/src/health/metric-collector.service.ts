import { Injectable } from '@nestjs/common';

export interface HttpMetricEntry {
  method: string;
  url: string;
  statusCode: number;
  durationMs: number;
  timestamp: number;
}

/**
 * MetricCollectorService — Coletor Centralizado de Métricas OpenMetrics/Prometheus
 *
 * Mantém contadores e quantis em memória com janela deslizante para exportação
 * no endpoint `/metrics` da plataforma.
 */
@Injectable()
export class MetricCollectorService {
  private static instance: MetricCollectorService;

  private totalRequests = 0;
  private statusCounts: Map<number, number> = new Map();
  private methodCounts: Map<string, number> = new Map();
  private durations: number[] = [];
  private securityViolationsCount = 0;

  // ── SLO Metrics (PROMPT 206) ────────────────────────────────────────
  // SLO Target: 99.9% availability (max 0.1% error rate)
  private readonly SLO_TARGET = 0.999;
  private serverErrorRequests = 0;  // HTTP 5xx counter

  constructor() {
    MetricCollectorService.instance = this;
  }

  public static getInstance(): MetricCollectorService {
    if (!MetricCollectorService.instance) {
      MetricCollectorService.instance = new MetricCollectorService();
    }
    return MetricCollectorService.instance;
  }

  recordRequest(method: string, statusCode: number, durationMs: number): void {
    this.totalRequests++;
    this.methodCounts.set(method, (this.methodCounts.get(method) ?? 0) + 1);
    this.statusCounts.set(statusCode, (this.statusCounts.get(statusCode) ?? 0) + 1);

    // Track 5xx errors for SLO availability calculation
    if (statusCode >= 500) {
      this.serverErrorRequests++;
    }

    this.durations.push(durationMs);
    // Limite de 2000 observações para cálculo de percentis (janela deslizante)
    if (this.durations.length > 2000) {
      this.durations.shift();
    }
  }

  recordSecurityViolation(): void {
    this.securityViolationsCount++;
  }

  getQuantile(q: number): number {
    if (this.durations.length === 0) return 0;
    const sorted = [...this.durations].sort((a, b) => a - b);
    const index = Math.min(Math.floor(sorted.length * q), sorted.length - 1);
    return sorted[index];
  }

  toOpenMetrics(): string {
    const memory = process.memoryUsage();
    const uptimeSeconds = Math.floor(process.uptime());

    const p50 = this.getQuantile(0.5);
    const p95 = this.getQuantile(0.95);
    const p99 = this.getQuantile(0.99);

    // ── SLO Calculations (PROMPT 206) ────────────────────────────────
    const availabilityRatio = this.totalRequests > 0
      ? (this.totalRequests - this.serverErrorRequests) / this.totalRequests
      : 1.0; // 100% se não houver requisições ainda

    const errorBudgetRemaining = Math.max(
      0,
      (availabilityRatio - this.SLO_TARGET) / (1 - this.SLO_TARGET),
    );

    const burnRate = this.totalRequests > 0
      ? (1 - availabilityRatio) / (1 - this.SLO_TARGET)
      : 0;

    let metrics = `# HELP aura_uptime_seconds Tempo de atividade da aplicacao em segundos\n`;
    metrics += `# TYPE aura_uptime_seconds gauge\n`;
    metrics += `aura_uptime_seconds ${uptimeSeconds}\n\n`;

    metrics += `# HELP aura_process_heap_bytes Uso de memoria heap do processo Node.js em bytes\n`;
    metrics += `# TYPE aura_process_heap_bytes gauge\n`;
    metrics += `aura_process_heap_bytes ${memory.heapUsed}\n\n`;

    metrics += `# HELP aura_process_rss_bytes Memoria residente (RSS) do processo em bytes\n`;
    metrics += `# TYPE aura_process_rss_bytes gauge\n`;
    metrics += `aura_process_rss_bytes ${memory.rss}\n\n`;

    metrics += `# HELP aura_http_requests_total Total de requisicoes HTTP processadas\n`;
    metrics += `# TYPE aura_http_requests_total counter\n`;
    metrics += `aura_http_requests_total ${this.totalRequests}\n\n`;

    for (const [status, count] of this.statusCounts.entries()) {
      metrics += `aura_http_requests_by_status{status="${status}"} ${count}\n`;
    }
    metrics += `\n`;

    metrics += `# HELP aura_http_request_duration_ms Quantis de latencia das requisicoes HTTP em milissegundos\n`;
    metrics += `# TYPE aura_http_request_duration_ms summary\n`;
    metrics += `aura_http_request_duration_ms{quantile="0.5"} ${p50}\n`;
    metrics += `aura_http_request_duration_ms{quantile="0.95"} ${p95}\n`;
    metrics += `aura_http_request_duration_ms{quantile="0.99"} ${p99}\n\n`;

    metrics += `# HELP aura_security_violations_total Total de tentativas de violacao de seguranca detectadas\n`;
    metrics += `# TYPE aura_security_violations_total counter\n`;
    metrics += `aura_security_violations_total ${this.securityViolationsCount}\n\n`;

    // ── SLO Metrics ───────────────────────────────────────────────────
    metrics += `# HELP aura_slo_availability_ratio Disponibilidade atual da plataforma (SLO Target: 0.999)\n`;
    metrics += `# TYPE aura_slo_availability_ratio gauge\n`;
    metrics += `aura_slo_availability_ratio{slo="availability",target="0.999"} ${availabilityRatio.toFixed(6)}\n\n`;

    metrics += `# HELP aura_error_budget_remaining_ratio Fracao do Error Budget de disponibilidade ainda restante\n`;
    metrics += `# TYPE aura_error_budget_remaining_ratio gauge\n`;
    metrics += `aura_error_budget_remaining_ratio{slo="availability"} ${errorBudgetRemaining.toFixed(6)}\n\n`;

    metrics += `# HELP aura_slo_burn_rate Taxa de consumo do Error Budget (1.0 = consumo no ritmo exato)\n`;
    metrics += `# TYPE aura_slo_burn_rate gauge\n`;
    metrics += `aura_slo_burn_rate{window="instant"} ${burnRate.toFixed(6)}\n\n`;

    metrics += `# HELP aura_server_error_requests_total Total de requisicoes com erro de servidor HTTP 5xx\n`;
    metrics += `# TYPE aura_server_error_requests_total counter\n`;
    metrics += `aura_server_error_requests_total ${this.serverErrorRequests}\n`;

    return metrics;
  }
}

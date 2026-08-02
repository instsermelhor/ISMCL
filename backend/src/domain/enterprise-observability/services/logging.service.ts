import { Injectable, Logger } from '@nestjs/common';
import { LogLevel } from '../dto/enterprise-observability.dto';
import { ObservabilityAuditService } from './observability-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface ApplicationLogEntry {
  logId: string;
  level: LogLevel;
  serviceName: string;
  message: string;
  context: Record<string, any>;
  traceId?: string;
  timestamp: string;
}

/**
 * LoggingService — P173 EORP
 *
 * Centralização corporativa de logs da Plataforma Aura.
 * Aplica mascaramento automático de dados sensíveis (LGPD Privacy by Design),
 * classificação por nível, retenção configurável e busca estruturada.
 */
@Injectable()
export class LoggingService {
  private readonly logger = new Logger(LoggingService.name);
  private readonly logBuffer: ApplicationLogEntry[] = [];

  constructor(
    private readonly auditSvc: ObservabilityAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async log(
    level: LogLevel,
    serviceName: string,
    message: string,
    context: Record<string, any> = {},
    traceId?: string,
  ): Promise<ApplicationLogEntry> {
    const logId = `LOG-${Date.now().toString(36).toUpperCase()}`;

    // Mascarar campos sensíveis LGPD (CPF, Email, Senhas, Cartões)
    const sanitizedContext = this.maskSensitiveData(context);
    const sanitizedMessage = this.maskSensitiveString(message);

    const entry: ApplicationLogEntry = {
      logId,
      level,
      serviceName,
      message: sanitizedMessage,
      context: sanitizedContext,
      traceId,
      timestamp: new Date().toISOString(),
    };

    this.logBuffer.push(entry);
    if (this.logBuffer.length > 5000) this.logBuffer.shift();

    return entry;
  }

  searchLogs(query: string, level?: LogLevel, serviceName?: string): ApplicationLogEntry[] {
    const q = query.toLowerCase();
    let results = this.logBuffer.filter((l) =>
      l.message.toLowerCase().includes(q) ||
      JSON.stringify(l.context).toLowerCase().includes(q),
    );

    if (level) results = results.filter((l) => l.level === level);
    if (serviceName) results = results.filter((l) => l.serviceName.toLowerCase() === serviceName.toLowerCase());

    return results.slice(-100).reverse();
  }

  private maskSensitiveData(context: Record<string, any>): Record<string, any> {
    const masked = { ...context };
    const sensitiveKeys = ['cpf', 'password', 'token', 'creditCard', 'secret', 'email'];

    for (const key of Object.keys(masked)) {
      if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
        masked[key] = '*** MASKED_LGPD ***';
      }
    }
    return masked;
  }

  private maskSensitiveString(str: string): string {
    // Regex de máscara básica de CPF (123.456.789-00)
    return str.replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, '***.***.***-**');
  }
}

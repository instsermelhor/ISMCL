import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { FastifyRequest, FastifyReply } from 'fastify';
import { Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MetricCollectorService } from '../../health/metric-collector.service';

/**
 * Campos cujos valores devem ser mascarados nos logs por questões de privacidade LGPD.
 */
const SENSITIVE_FIELDS = [
  'password',
  'passwordConfirmation',
  'token',
  'refreshToken',
  'accessToken',
  'secret',
  'cpf',
  'cnpj',
  'rg',
  'creditCard',
  'cardNumber',
  'cvv',
];

/**
 * LoggingInterceptor — Interceptor de Logging Estruturado
 *
 * Responsável por:
 * - Gerar e propagar X-Request-ID em cada requisição
 * - Logar entrada de requisições com método, url, headers relevantes
 * - Logar saída de respostas com status, duração em ms
 * - Mascarar automaticamente campos sensíveis (LGPD)
 * - Adicionar X-Request-ID no header de resposta
 *
 * Referências: P102 (AEBPF), P117 (AEOSMRP), P128 (AECS), P131 (AFPI)
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const response = ctx.getResponse<FastifyReply>();

    // Geração e propagação do Request ID
    const requestId =
      (request.headers['x-request-id'] as string) || randomUUID();
    (request as FastifyRequest & { requestId: string }).requestId = requestId;

    // Header de correlação na resposta
    void response.header('X-Request-ID', requestId);

    const startTime = Date.now();
    const { method, url } = request;
    const userAgent = request.headers['user-agent'] ?? '';
    const tenantId = (request.headers['x-tenant-id'] as string) ?? 'default';

    this.logger.log({
      requestId,
      tenantId,
      method,
      url,
      userAgent,
      body: this.sanitizeBody(request.body),
      message: `[→] ${method} ${url}`,
    });

    return next.handle().pipe(
      tap((responseBody: unknown) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        MetricCollectorService.getInstance().recordRequest(method, statusCode, duration);

        this.logger.log({
          requestId,
          tenantId,
          method,
          url,
          statusCode,
          duration: `${duration}ms`,
          message: `[←] ${method} ${url} ${statusCode} — ${duration}ms`,
        });

        // Métricas de SLO: log separado para requests lentos (P95 > 200ms)
        if (duration > 200) {
          this.logger.warn({
            requestId,
            method,
            url,
            duration,
            sloViolation: true,
            message: `[SLO] Requisição lenta detectada: ${duration}ms`,
          });
        }
      }),
      catchError((error: unknown) => {
        const duration = Date.now() - startTime;
        MetricCollectorService.getInstance().recordRequest(method, 500, duration);
        this.logger.error({
          requestId,
          tenantId,
          method,
          url,
          duration: `${duration}ms`,
          error: error instanceof Error ? error.message : String(error),
          message: `[✗] ${method} ${url} — Error em ${duration}ms`,
        });
        return throwError(() => error);
      }),
    );
  }

  /**
   * Remove valores de campos sensíveis do corpo da requisição antes do log.
   * Garante conformidade LGPD — Art. 46 (segurança no tratamento de dados).
   */
  private sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') return body;

    const sanitized = { ...(body as Record<string, unknown>) };
    for (const field of SENSITIVE_FIELDS) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    return sanitized;
  }
}

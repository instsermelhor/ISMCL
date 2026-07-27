import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Prisma } from '@prisma/client';

/**
 * RFC 7807 Problem Details structure
 * @see https://datatracker.ietf.org/doc/html/rfc7807
 */
interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  timestamp: string;
  requestId?: string;
  errors?: ValidationErrorItem[];
  traceId?: string;
}

interface ValidationErrorItem {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * GlobalExceptionFilter — Filtro Global de Exceções
 *
 * Captura todas as exceções não tratadas da aplicação e as transforma
 * em respostas RFC 7807 (Problem Details) padronizadas.
 *
 * Categorias tratadas:
 * - HttpException (NestJS/Fastify)
 * - Prisma errors (P2002, P2003, P2025)
 * - Erros de validação (class-validator)
 * - Erros genéricos (500 Internal Server Error)
 *
 * Referências: P102 (AEBPF), P125 (AEAP - RFC 7807), P131 (AFPI)
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  private readonly BASE_TYPE_URI =
    'https://api.aura.sermelhor.org.br/problems';

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const requestId =
      (request.headers['x-request-id'] as string) || 'unknown';
    const instance = `${request.method} ${request.url}`;
    const timestamp = new Date().toISOString();

    let problem: ProblemDetails;

    // ── HttpException ──────────────────────────────────────────────────────────
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      let detail: string;
      let errors: ValidationErrorItem[] | undefined;

      if (typeof response === 'object' && 'message' in response) {
        const messages = (response as { message: string | string[] }).message;
        if (Array.isArray(messages)) {
          errors = messages.map((msg) => this.parseValidationMessage(msg));
          detail = 'Um ou mais campos falharam na validação.';
        } else {
          detail = messages;
        }
      } else {
        detail = exception.message;
      }

      problem = {
        type: `${this.BASE_TYPE_URI}/${status}`,
        title: exception.name,
        status,
        detail,
        instance,
        timestamp,
        requestId,
        ...(errors && { errors }),
      };

      if (status >= 500) {
        this.logger.error({ problem, exception }, 'HTTP 5xx error');
      } else if (status >= 400) {
        this.logger.warn({ problem }, 'HTTP 4xx error');
      }
    }

    // ── Prisma Known Errors ────────────────────────────────────────────────────
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const { status, title, detail } = this.mapPrismaError(exception);
      problem = {
        type: `${this.BASE_TYPE_URI}/database-error`,
        title,
        status,
        detail,
        instance,
        timestamp,
        requestId,
      };
      this.logger.error({ problem, code: exception.code }, 'Prisma error');
    }

    // ── Generic / Unknown Errors ───────────────────────────────────────────────
    else {
      const isDev = process.env.NODE_ENV !== 'production';
      const err = exception instanceof Error ? exception : new Error(String(exception));

      problem = {
        type: `${this.BASE_TYPE_URI}/internal-server-error`,
        title: 'Internal Server Error',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        detail: isDev
          ? err.message
          : 'Ocorreu um erro inesperado. Por favor, tente novamente.',
        instance,
        timestamp,
        requestId,
        ...(isDev && { traceId: err.stack?.split('\n')[1]?.trim() }),
      };

      this.logger.error(
        { problem, stack: err.stack },
        'Unhandled exception',
      );
    }

    void reply.status(problem.status).headers({
      'Content-Type': 'application/problem+json',
      'X-Request-ID': requestId,
    }).send(problem);
  }

  private mapPrismaError(
    err: Prisma.PrismaClientKnownRequestError,
  ): { status: number; title: string; detail: string } {
    switch (err.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          title: 'Conflito de Recurso',
          detail: `Já existe um registro com o valor fornecido para o campo único: ${String(err.meta?.target ?? 'desconhecido')}.`,
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          title: 'Referência Inválida',
          detail: `Referência a registro relacionado não encontrado: ${String(err.meta?.field_name ?? 'desconhecido')}.`,
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          title: 'Registro Não Encontrado',
          detail: 'O registro solicitado não foi encontrado.',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          title: 'Database Error',
          detail: `Erro de banco de dados: ${err.code}.`,
        };
    }
  }

  private parseValidationMessage(message: string): ValidationErrorItem {
    const parts = message.split('|');
    if (parts.length === 2) {
      return { field: parts[0], message: parts[1] };
    }
    return { field: 'unknown', message };
  }
}

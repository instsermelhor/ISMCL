import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMeta } from './pagination.dto';

/**
 * BaseResponseDto — Envelope de resposta padrão da Plataforma Aura.
 *
 * Todos os endpoints REST devem retornar respostas neste formato.
 * Facilita o consumo uniforme pelas aplicações clientes (Web, Mobile, Integradores).
 *
 * Referências: P125 (AEAP), P131 (AFPI)
 */
export class BaseResponseDto<T = unknown> {
  @ApiProperty({ description: 'Indica se a operação foi bem-sucedida' })
  success: boolean;

  @ApiProperty({ description: 'Dados da resposta (genérico)' })
  data: T;

  @ApiPropertyOptional({ description: 'Metadados de paginação (apenas em listagens)' })
  meta?: PaginationMeta;

  @ApiProperty({ description: 'Timestamp ISO 8601 da resposta' })
  timestamp: string;

  @ApiProperty({ description: 'ID único da requisição para rastreabilidade' })
  requestId: string;

  @ApiPropertyOptional({ description: 'ID de trace distribuído (OpenTelemetry)' })
  traceId?: string;

  @ApiPropertyOptional({ description: 'Mensagem informativa adicional' })
  message?: string;

  private constructor(
    success: boolean,
    data: T,
    requestId: string,
    meta?: PaginationMeta,
    message?: string,
    traceId?: string,
  ) {
    this.success = success;
    this.data = data;
    this.meta = meta;
    this.timestamp = new Date().toISOString();
    this.requestId = requestId;
    this.traceId = traceId;
    this.message = message;
  }

  /** Cria uma resposta de sucesso */
  static ok<T>(
    data: T,
    requestId: string,
    meta?: PaginationMeta,
    message?: string,
  ): BaseResponseDto<T> {
    return new BaseResponseDto(true, data, requestId, meta, message);
  }

  /** Cria uma resposta de sucesso para criação (201 Created) */
  static created<T>(
    data: T,
    requestId: string,
    message = 'Recurso criado com sucesso.',
  ): BaseResponseDto<T> {
    return new BaseResponseDto(true, data, requestId, undefined, message);
  }

  /** Cria uma resposta de listagem paginada */
  static paginated<T>(
    data: T[],
    requestId: string,
    page: number,
    limit: number,
    total: number,
  ): BaseResponseDto<T[]> {
    return new BaseResponseDto(
      true,
      data,
      requestId,
      new PaginationMeta(page, limit, total),
    );
  }
}

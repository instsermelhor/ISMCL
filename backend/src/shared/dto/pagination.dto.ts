import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsIn,
  Max,
  Min,
} from 'class-validator';

/**
 * PaginationDto — DTO de paginação padrão da Plataforma Aura.
 *
 * Todos os endpoints de listagem devem aceitar estes parâmetros de query.
 * Limite máximo: 100 registros por página para prevenção de abuse.
 *
 * Referências: P125 (AEAP), P131 (AFPI)
 */
export class PaginationDto {
  @ApiPropertyOptional({ description: 'Número da página (1-indexed)', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page|Página deve ser um número inteiro.' })
  @Min(1, { message: 'page|Página mínima é 1.' })
  page: number = 1;

  @ApiPropertyOptional({ description: 'Itens por página (máximo 100)', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit|Limite deve ser um número inteiro.' })
  @Min(1, { message: 'limit|Limite mínimo é 1.' })
  @Max(100, { message: 'limit|Limite máximo é 100 registros por página.' })
  limit: number = 20;

  @ApiPropertyOptional({ description: 'Campo para ordenação' })
  @IsOptional()
  @IsString({ message: 'orderBy|Campo de ordenação deve ser uma string.' })
  orderBy?: string;

  @ApiPropertyOptional({ description: 'Direção da ordenação', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'orderDirection|Direção deve ser "asc" ou "desc".' })
  orderDirection: 'asc' | 'desc' = 'desc';

  /** Calcula o offset para uso em queries de banco */
  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}

/**
 * PaginationMeta — Metadados de paginação para respostas de listagem.
 */
export class PaginationMeta {
  @ApiProperty({ description: 'Página atual' })
  page: number;

  @ApiProperty({ description: 'Itens por página' })
  limit: number;

  @ApiProperty({ description: 'Total de registros' })
  total: number;

  @ApiProperty({ description: 'Total de páginas' })
  totalPages: number;

  @ApiProperty({ description: 'Existe página anterior?' })
  hasPreviousPage: boolean;

  @ApiProperty({ description: 'Existe próxima página?' })
  hasNextPage: boolean;

  constructor(page: number, limit: number, total: number) {
    this.page = page;
    this.limit = limit;
    this.total = total;
    this.totalPages = Math.ceil(total / limit);
    this.hasPreviousPage = page > 1;
    this.hasNextPage = page < this.totalPages;
  }
}

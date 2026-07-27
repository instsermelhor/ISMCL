import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @Public — Decorator para marcar endpoints como públicos (sem autenticação).
 *
 * Uso:
 * ```ts
 * @Public()
 * @Get('health')
 * health() { return { status: 'ok' }; }
 * ```
 *
 * Referências: P107 (AEIATP), P131 (AFPI)
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

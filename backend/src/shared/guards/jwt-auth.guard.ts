import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { FastifyRequest } from 'fastify';
import * as jose from 'jose';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

export interface AuraJwtPayload {
  sub: string;
  email: string;
  name: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  realm_access?: { roles: string[] };
  resource_access?: Record<string, { roles: string[] }>;
  iss: string;
  aud: string | string[];
  exp: number;
  iat: number;
  jti: string;
}

/**
 * JwtAuthGuard — Guard de Autenticação JWT / OAuth 2.1
 *
 * Valida tokens JWT emitidos pelo Keycloak 24 ou pelo serviço de auth local.
 * Funcionalidades:
 * - Skip automático em endpoints marcados com @Public()
 * - Verificação de assinatura via JWKS (cache de 5 minutos)
 * - Validação de issuer, audience e expiração
 * - Extração de tenantId, roles e permissions do JWT claim
 * - Injeção do payload no request para uso por controllers e guards downstream
 *
 * Referências: P107 (AEIATP), P128 (AECS), P131 (AFPI)
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private jwksClient: ReturnType<typeof jose.createRemoteJWKSet> | null = null;
  private jwksLastFetch = 0;
  private readonly JWKS_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Rota pública — skip da autenticação
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException(
        'Token de autenticação ausente ou inválido.',
      );
    }

    try {
      const payload = await this.verifyToken(token);
      (
        request as FastifyRequest & { user: AuraJwtPayload }
      ).user = payload;
      return true;
    } catch (error) {
      this.logger.warn(
        { error: error instanceof Error ? error.message : String(error) },
        'JWT validation failed',
      );
      throw new UnauthorizedException(
        'Token inválido, expirado ou sem permissão.',
      );
    }
  }

  private extractToken(request: FastifyRequest): string | null {
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }
    return null;
  }

  private async verifyToken(token: string): Promise<AuraJwtPayload> {
    const keycloakUrl = this.config.get<string>('KEYCLOAK_URL');
    const realm = this.config.get<string>('KEYCLOAK_REALM', 'aura');
    const jwtSecret = this.config.get<string>('JWT_SECRET');

    // Modo desenvolvimento sem Keycloak configurado — usa JWT simétrico
    if (!keycloakUrl) {
      const secret = new TextEncoder().encode(jwtSecret);
      const { payload } = await jose.jwtVerify(token, secret, {
        algorithms: ['HS256'],
      });
      return payload as unknown as AuraJwtPayload;
    }

    // Modo produção — JWKS assimétrico via Keycloak
    const jwks = await this.getJwksClient(keycloakUrl, realm);
    const expectedIssuer = `${keycloakUrl}/realms/${realm}`;
    const expectedAudience = this.config.get<string>(
      'KEYCLOAK_CLIENT_ID',
      'aura-backend',
    );

    const { payload } = await jose.jwtVerify(token, jwks, {
      issuer: expectedIssuer,
      audience: expectedAudience,
      algorithms: ['RS256'],
    });

    return payload as unknown as AuraJwtPayload;
  }

  private async getJwksClient(
    keycloakUrl: string,
    realm: string,
  ): Promise<ReturnType<typeof jose.createRemoteJWKSet>> {
    const now = Date.now();
    if (!this.jwksClient || now - this.jwksLastFetch > this.JWKS_CACHE_TTL) {
      const jwksUri = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`;
      this.jwksClient = jose.createRemoteJWKSet(new URL(jwksUri), {
        cacheMaxAge: this.JWKS_CACHE_TTL,
      });
      this.jwksLastFetch = now;
      this.logger.debug(`JWKS client refreshed from ${jwksUri}`);
    }
    return this.jwksClient;
  }
}

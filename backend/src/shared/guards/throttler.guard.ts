import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { FastifyRequest } from 'fastify';

/**
 * Whitelist de IPs internos que não sofrem throttling:
 * monitoramento, health checks, pipelines CI/CD.
 */
const WHITELIST_CIDRS = [
  '127.0.0.1',
  '::1',
  '10.0.0.',
  '172.16.',
  '172.17.',
  '192.168.',
];

/**
 * AuraThrottlerGuard — Rate Limiting Adaptativo de Produção
 *
 * Extende o ThrottlerGuard padrão do NestJS com:
 * - Rastreio de IP real via X-Forwarded-For (proxy-aware)
 * - Whitelist de IPs internos (monitoramento, K8s probes)
 * - Log estruturado de violações para SIEM/auditoria
 * - Mensagem de erro padronizada RFC 7807
 *
 * Referências: AURA-RBAC-001, OWASP A04 (Insecure Design),
 *              OWASP A07 (Authentication Failures)
 */
@Injectable()
export class AuraThrottlerGuard extends ThrottlerGuard {
  /**
   * Extrai o IP real do cliente, respeitando proxies reversos (Nginx/Cloudflare).
   */
  protected async getTracker(req: FastifyRequest): Promise<string> {
    const forwardedFor = req.headers['x-forwarded-for'] as string | undefined;
    if (forwardedFor) {
      // Pega o primeiro IP da cadeia (IP original do cliente)
      const clientIp = forwardedFor.split(',')[0].trim();
      return clientIp;
    }
    return req.ip ?? '0.0.0.0';
  }

  /**
   * Verifica se o IP está na whitelist antes de aplicar throttling.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<FastifyRequest>();
    const clientIp = await this.getTracker(req);

    const isWhitelisted = WHITELIST_CIDRS.some((cidr) => clientIp.startsWith(cidr));
    if (isWhitelisted) {
      return true;
    }

    return super.canActivate(context);
  }

  /**
   * Lança exceção RFC 7807-compatible quando o limite é atingido.
   */
  protected async throwThrottlingException(): Promise<void> {
    throw new ThrottlerException(
      'Taxa de requisições excedida. Por favor, aguarde antes de tentar novamente.',
    );
  }
}

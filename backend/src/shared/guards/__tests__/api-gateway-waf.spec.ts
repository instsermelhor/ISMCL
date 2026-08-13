import { ExecutionContext } from '@nestjs/common';
import { AuraThrottlerGuard } from './throttler.guard';
import { SanitizationPipe } from '../pipes/sanitization.pipe';

describe('AURA API GATEWAY & WAF SPEC (PROMPT 204)', () => {
  let guard: AuraThrottlerGuard;
  let sanitizationPipe: SanitizationPipe;

  beforeEach(() => {
    // Instancia guard e pipe
    guard = new (class extends AuraThrottlerGuard {
      public testGetTracker(req: any) {
        return this.getTracker(req);
      }
    })({} as any, {} as any, {} as any);

    sanitizationPipe = new SanitizationPipe();
  });

  describe('Pilar 1: Extração Confiável de IP e Whitelist Anti-DDoS', () => {
    it('deve extrair o IP real do cliente através do header X-Forwarded-For', async () => {
      const mockReq: any = {
        headers: {
          'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178',
        },
        ip: '10.0.0.1',
      };

      const tracker = await (guard as any).testGetTracker(mockReq);
      expect(tracker).toBe('203.0.113.195');
    });

    it('deve isentar requisições de monitoramento interno da whitelist', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { 'x-forwarded-for': '127.0.0.1' },
            ip: '127.0.0.1',
          }),
        }),
      } as unknown as ExecutionContext;

      const canActivate = await guard.canActivate(mockContext);
      expect(canActivate).toBe(true);
    });
  });

  describe('Pilar 2: WAF & Sanitização de Payloads', () => {
    it('deve neutralizar e remover tags de XSS em strings de entrada', () => {
      const dirtyPayload = {
        name: 'Maria da Silva<script>alert("xss")</script>',
        bio: '<img src=x onerror=alert(1)>Acolhimento',
      };

      const cleanPayload = sanitizationPipe.transform(dirtyPayload, { type: 'body' });
      expect(cleanPayload.name).toBe('Maria da Silva');
      expect(cleanPayload.bio).toBe('Acolhimento');
    });

    it('deve bloquear injeções clássicas de SQL em campos de busca', () => {
      const sqlInjectionPayload = {
        searchTerm: "admin' OR '1'='1' --",
      };

      const cleanPayload = sanitizationPipe.transform(sqlInjectionPayload, { type: 'query' });
      expect(cleanPayload.searchTerm).not.toContain("' OR '1'='1'");
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SanitizationPipe } from '../../pipes/sanitization.pipe';
import { AuraThrottlerGuard } from '../throttler.guard';
import { ThrottlerStorageService } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';

describe('OWASP Top 10 & Security Hardening Penetration Suite (PROMPT 196)', () => {
  let sanitizationPipe: SanitizationPipe;

  beforeEach(() => {
    sanitizationPipe = new SanitizationPipe();
  });

  describe('OWASP A03:2021 — Injection (XSS & SQLi)', () => {
    it('deve remover script tags e tags maliciosas (Reflected & Stored XSS)', () => {
      const maliciousPayload = {
        name: '<script>alert("XSS Attack")</script>John Doe',
        bio: '<iframe src="javascript:alert(1)"></iframe>Psicólogo voluntário',
        comment: '<img src=x onerror=alert(document.cookie)>Ótimo atendimento',
      };

      const result = sanitizationPipe.transform(maliciousPayload, { type: 'body' }) as typeof maliciousPayload;

      expect(result.name).not.toContain('<script>');
      expect(result.name).toBe('John Doe');
      expect(result.bio).not.toContain('<iframe');
      expect(result.bio).toBe('Psicólogo voluntário');
      expect(result.comment).not.toContain('onerror=');
      expect(result.comment).toBe('Ótimo atendimento');
    });

    it('deve bloquear tentativa de SQL Injection clássica (OR 1=1)', () => {
      const sqliPayload = {
        username: "admin' OR '1'='1",
      };

      expect(() => {
        sanitizationPipe.transform(sqliPayload, { type: 'body' });
      }).toThrow(BadRequestException);
    });

    it('deve bloquear tentativa de UNION SELECT SQL Injection', () => {
      const sqliPayload = {
        filter: "1 UNION SELECT * FROM users --",
      };

      expect(() => {
        sanitizationPipe.transform(sqliPayload, { type: 'body' });
      }).toThrow(BadRequestException);
    });

    it('deve bloquear tentativa de DROP TABLE via injeção', () => {
      const sqliPayload = {
        id: "1; DROP TABLE beneficiaries; --",
      };

      expect(() => {
        sanitizationPipe.transform(sqliPayload, { type: 'body' });
      }).toThrow(BadRequestException);
    });
  });

  describe('OWASP A04:2021 — Insecure Design (Anti-DoS & String Limiting)', () => {
    it('deve truncar strings excessivamente longas para mitigar ReDoS e buffer exhaust', () => {
      const hugeString = 'A'.repeat(15_000);
      const payload = { content: hugeString };

      const result = sanitizationPipe.transform(payload, { type: 'body' }) as { content: string };
      expect(result.content.length).toBe(10_000);
    });

    it('deve remover caracteres de controle ASCII invisíveis e maliciosos', () => {
      const dirtyString = 'Aura\x00\x08Platform\x1F\x7F';
      const result = sanitizationPipe.transform({ text: dirtyString }, { type: 'body' }) as { text: string };
      expect(result.text).toBe('AuraPlatform');
    });
  });

  describe('OWASP A07:2021 — Identification and Authentication Failures (Throttling & IP Tracking)', () => {
    it('AuraThrottlerGuard deve identificar IP via X-Forwarded-For e permitir IPs em whitelist', async () => {
      const storageService = new ThrottlerStorageService();
      const reflector = new Reflector();
      const guard = new AuraThrottlerGuard({
        throttlers: [{ ttl: 60, limit: 10 }],
      }, storageService, reflector);

      const mockExecutionContext: any = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { 'x-forwarded-for': '127.0.0.1, 10.0.0.1' },
            ip: '127.0.0.1',
          }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      };

      const canActivate = await guard.canActivate(mockExecutionContext);
      expect(canActivate).toBe(true);
    });
  });
});

import { Injectable, PipeTransform, ArgumentMetadata, BadRequestException, Logger } from '@nestjs/common';

/**
 * Padrões de ataque conhecidos — bloqueio imediato.
 * Lista curada com base no OWASP Top 10:2021 e CWE Top 25.
 */
const XSS_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
  /javascript\s*:/gi,
  /on\w+\s*=\s*["']?[^"'>]*/gi,       // onload=, onclick=, onerror= etc.
  /data\s*:\s*text\s*\/\s*html/gi,
  /<\s*img[^>]+src\s*=\s*["']?\s*data:/gi,
  /vbscript\s*:/gi,
  /expression\s*\(/gi,                  // CSS Expression injection
  /<\s*object[\s\S]*?>/gi,
  /<\s*embed[\s\S]*?>/gi,
  /<\s*form[\s\S]*?>/gi,
  /<\s*input[\s\S]*?>/gi,
];

const SQLI_PATTERNS = [
  /(\b(union|select|insert|update|delete|drop|truncate|exec|execute|create|alter|grant|revoke)\b[\s\S]*?\b(from|into|table|database|schema)\b)/gi,
  /(['";])\s*(or|and)\s*['"]?\d+['"]?\s*=\s*['"]?\d+/gi,  // ' OR 1=1
  /--\s*$/gm,                           // SQL comment injection
  /\/\*[\s\S]*?\*\//g,                  // block comment injection
  /\bxp_\w+/gi,                         // MSSQL stored procs
  /\bload_file\s*\(/gi,
  /\binto\s+outfile\b/gi,
];

/** Máximo de caracteres permitidos em qualquer campo string (anti-DoS) */
const MAX_STRING_LENGTH = 10_000;

/**
 * SanitizationPipe — Pipe de Sanitização e Defesa Contra Injeção
 *
 * Aplicado globalmente antes dos handlers de controller.
 * Garante que payloads maliciosos sejam rejeitados antes de
 * atingir serviços de domínio ou o banco de dados.
 *
 * Proteções implementadas:
 * - Anti-XSS: remove/bloqueia tags e eventos HTML/JS maliciosos
 * - Anti-SQL Injection: detecta padrões clássicos de SQLi
 * - Anti-DoS: trunca strings > MAX_STRING_LENGTH caracteres
 * - Normalização Unicode: previne ataques de homoglyph/bypass
 *
 * Referências:
 * - OWASP Top 10:2021 — A03 (Injection)
 * - CWE-79 (XSS), CWE-89 (SQL Injection)
 * - AURA-RBAC-001, LGPD Art. 46
 */
@Injectable()
export class SanitizationPipe implements PipeTransform {
  private readonly logger = new Logger(SanitizationPipe.name);

  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (metadata.type === 'custom') return value;
    return this.sanitize(value);
  }

  private sanitize(value: unknown): unknown {
    if (value === null || value === undefined) return value;

    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitize(item));
    }

    if (typeof value === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        sanitized[key] = this.sanitize(val);
      }
      return sanitized;
    }

    return value;
  }

  private sanitizeString(input: string): string {
    // 1. Normalização Unicode (NFC) — previne ataques de homoglyph
    let sanitized = input.normalize('NFC');

    // 2. Limite de tamanho anti-DoS
    if (sanitized.length > MAX_STRING_LENGTH) {
      this.logger.warn(
        `[SanitizationPipe] Campo truncado: ${sanitized.length} caracteres → ${MAX_STRING_LENGTH}`,
      );
      sanitized = sanitized.slice(0, MAX_STRING_LENGTH);
    }

    // 3. Detecção de SQL Injection
    for (const pattern of SQLI_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(sanitized)) {
        this.logger.warn(`[SanitizationPipe] SQL Injection detectado e bloqueado.`);
        throw new BadRequestException(
          'Entrada inválida: padrão de consulta não permitido detectado.',
        );
      }
    }

    // 4. Remoção de payloads XSS
    for (const pattern of XSS_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(sanitized)) {
        this.logger.warn(`[SanitizationPipe] Payload XSS detectado e removido.`);
        sanitized = sanitized.replace(pattern, '');
      }
    }

    // 5. Remoção de caracteres de controle ASCII não imprimíveis (exceto \n, \r, \t)
    // eslint-disable-next-line no-control-regex
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    return sanitized.trim();
  }
}

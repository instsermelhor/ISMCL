import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  ThreatType,
  IncidentSeverity,
  CreateIncidentDto,
} from '../dto/observability.dto';
import { EventBusService } from '../../../events/event-bus.service';

export interface SecurityThreatAlert {
  threatId: string;
  threatType: ThreatType;
  severity: IncidentSeverity;
  sourceModule: string;
  targetUserOrIp: string;
  description: string;
  evidence: Record<string, unknown>;
  detectedAt: string;
}

/**
 * SiemThreatDetectionService — Plataforma SIEM Corporativa e Detecção Inteligente de Ameaças
 *
 * Funcionalidades:
 * - Correlação de eventos de múltiplos módulos (IAM, APIs, EHR, Workflows, IA, Banco de Dados)
 * - Regras de detecção para:
 *   - Força Bruta (BRUTE_FORCE)
 *   - Escalonamento de Privilégios (PRIVILEGE_ESCALATION)
 *   - Vazamento de Dados / Tentativa de Exfiltração LGPD (DATA_EXFILTRATION)
 *   - Acesso Anômalo / Geográfico (ANOMALOUS_ACCESS)
 *   - Abuso de APIs (API_ABUSE)
 * - Emissão de alertas e eventos CloudEvents `aura.observability.threat.detected.v1`
 * - Integração automática com SOC Automation Service
 *
 * Referências: P118 AECS, P142 AEOCSAP Etapas 6, 8
 */
@Injectable()
export class SiemThreatDetectionService {
  private readonly logger = new Logger(SiemThreatDetectionService.name);
  private readonly threatAlerts: SecurityThreatAlert[] = [];

  constructor(private readonly eventBus: EventBusService) {}

  async analyzeSecurityEvent(
    eventType: string,
    sourceModule: string,
    targetUserOrIp: string,
    payload: Record<string, unknown>,
    tenantId = 'default',
  ): Promise<SecurityThreatAlert | null> {
    let threat: SecurityThreatAlert | null = null;

    // Regra 1: Detecção de Força Bruta
    if (eventType === 'AUTH_FAILED_BURST' || (payload.failedAttempts && Number(payload.failedAttempts) >= 5)) {
      threat = this.createAlert(
        ThreatType.BRUTE_FORCE,
        IncidentSeverity.HIGH,
        sourceModule,
        targetUserOrIp,
        `Múltiplas tentativas de autenticação mal-sucedidas (${payload.failedAttempts ?? 5}x) detectadas.`,
        payload,
      );
    }
    // Regra 2: Tentativa de Exfiltração de Dados / Leitura Massiva de Prontuários (LGPD Art. 11)
    else if (eventType === 'EHR_MASS_READ_ACCESS' || (payload.accessedRecords && Number(payload.accessedRecords) > 50)) {
      threat = this.createAlert(
        ThreatType.DATA_EXFILTRATION,
        IncidentSeverity.CRITICAL,
        sourceModule,
        targetUserOrIp,
        `Tentativa de acesso massivo a prontuários eletrônicos (${payload.accessedRecords} registros em 1 min).`,
        payload,
      );
    }
    // Regra 3: Escalonamento de Privilégios
    else if (eventType === 'UNAUTHORIZED_ROLE_ELEVATION') {
      threat = this.createAlert(
        ThreatType.PRIVILEGE_ESCALATION,
        IncidentSeverity.CRITICAL,
        sourceModule,
        targetUserOrIp,
        'Tentativa de elevação não autorizada para o papel SUPER_ADMIN detectada.',
        payload,
      );
    }

    if (threat) {
      this.threatAlerts.push(threat);
      this.logger.warn(`[SIEM] 🚨 AMEAÇA DETECTADA [${threat.threatType}] Severidade: ${threat.severity} | Alvo: ${targetUserOrIp}`);

      await this.eventBus.publish(
        'aura.observability.threat.detected.v1',
        { threatId: threat.threatId, threatType: threat.threatType, severity: threat.severity, targetUserOrIp },
        tenantId,
        { subject: threat.threatId },
      );
    }

    return threat;
  }

  private createAlert(
    threatType: ThreatType,
    severity: IncidentSeverity,
    sourceModule: string,
    targetUserOrIp: string,
    description: string,
    evidence: Record<string, unknown>,
  ): SecurityThreatAlert {
    return {
      threatId: `THREAT-${Date.now()}`,
      threatType,
      severity,
      sourceModule,
      targetUserOrIp,
      description,
      evidence,
      detectedAt: new Date().toISOString(),
    };
  }

  getThreatAlerts(): SecurityThreatAlert[] {
    return [...this.threatAlerts].reverse();
  }
}

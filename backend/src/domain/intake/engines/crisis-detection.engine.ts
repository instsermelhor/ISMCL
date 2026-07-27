import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../../../events/event-bus.service';

export interface CrisisDetectionResult {
  hasCrisis: boolean;
  severity: 'NONE' | 'MODERATE' | 'HIGH' | 'CRITICAL_IMMEDIATE';
  detectedTriggers: string[];
  protocolToTrigger?: string;
  immediateActionsRequired: string[];
  evaluatedAt: string;
}

/**
 * CrisisDetectionEngine — Detector de Situações Críticas & Emergências Assistenciais
 *
 * Analisa os relatos de triagem e identifica precocemente:
 * - Ideação / Risco de Suicídio (protocolo de emergência psiquiátrica)
 * - Automutilação / Sofrimento psíquico severo
 * - Violência Doméstica / Abuso Infantil / Violência Sexual
 * - Negligência / Insegurança Alimentar Extrema
 *
 * Ao identificar risco elevado:
 * 1. Eleva a prioridade do acolhimento para CRITICAL
 * 2. Emite o evento `aura.intake.crisis.detected.v1`
 * 3. Notifica a equipe de retaguarda em regime de plantão
 *
 * Referências: P110 (AEWBPM), P128 (AECS), P134 (AIWSP Etapa 6)
 */
@Injectable()
export class CrisisDetectionEngine {
  private readonly logger = new Logger(CrisisDetectionEngine.name);

  // Palavras-chave e padrões de alto risco
  private readonly CRITICAL_KEYWORDS = [
    'suicidio',
    'suicídio',
    'matar',
    'tirar a vida',
    'automutilacao',
    'automutilação',
    'agressão física',
    'abuso sexual',
    'estupro',
    'violencia domestica',
    'violência doméstica',
    'ameaça de morte',
    'sem comida há dias',
  ];

  constructor(private readonly eventBus: EventBusService) {}

  /**
   * Avalia o texto do relato e os fatores selecionados.
   */
  async evaluate(
    intakeId: string,
    chiefComplaint: string,
    factors: string[],
    tenantId = 'default',
  ): Promise<CrisisDetectionResult> {
    const evaluatedAt = new Date().toISOString();
    const detectedTriggers: string[] = [];
    const lowerText = chiefComplaint.toLowerCase();

    // 1. Verificação por palavras-chave críticas no relato
    for (const keyword of this.CRITICAL_KEYWORDS) {
      if (lowerText.includes(keyword)) {
        detectedTriggers.push(`Palavra-chave de risco: "${keyword}"`);
      }
    }

    // 2. Verificação por fatores estruturados
    for (const factor of factors) {
      if (
        factor.includes('SUICIDE') ||
        factor.includes('VIOLENCE') ||
        factor.includes('ABUSE') ||
        factor.includes('SELF_HARM')
      ) {
        detectedTriggers.push(`Fator crítico selecionado: ${factor}`);
      }
    }

    const hasCrisis = detectedTriggers.length > 0;
    let severity: CrisisDetectionResult['severity'] = 'NONE';
    let protocolToTrigger: string | undefined;
    const immediateActionsRequired: string[] = [];

    if (hasCrisis) {
      severity = detectedTriggers.length >= 2 ? 'CRITICAL_IMMEDIATE' : 'HIGH';
      protocolToTrigger = 'PROTOCOLO_EMERGENCIA_PSICOSSOCIAL_V1';

      immediateActionsRequired.push('Notificar Plantão de Psicologia/Psiquiatria');
      immediateActionsRequired.push('Encaminhar para Acolhimento Presencial Imediato / Telemedicina de Urgência');
      immediateActionsRequired.push('Emitir Alerta Vermelho de Segurança');

      this.logger.error(
        `[CrisisDetection] 🚨 CRISE DETECTADA em Intake ${intakeId}! Triggers: ${detectedTriggers.join(', ')}`,
      );

      // Emissão de evento de emergência
      await this.eventBus.publish(
        'aura.intake.crisis.detected.v1',
        {
          intakeId,
          severity,
          detectedTriggers,
          protocolToTrigger,
        },
        tenantId,
        { subject: intakeId },
      );
    }

    return {
      hasCrisis,
      severity,
      detectedTriggers,
      protocolToTrigger,
      immediateActionsRequired,
      evaluatedAt,
    };
  }
}

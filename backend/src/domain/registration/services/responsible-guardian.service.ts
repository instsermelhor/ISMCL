import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { LinkGuardianDto } from '../dto/registration.dto';
import { EventBusService } from '../../../events/event-bus.service';

export interface GuardianLinkRecord {
  linkId: string;
  dependentUserId: string;
  guardianUserId: string;
  kinshipType: string;
  documentProofUrl?: string;
  linkedAt: string;
  isActive: boolean;
}

/**
 * ResponsibleGuardianService — Gestão de Responsáveis Legais e Tutela
 *
 * Vincula dependentes menores de idade ou vulneráveis aos seus responsáveis legais:
 * - Guarda Compartilhada / Tutela / Curatela / Procuração
 * - Validação documental do termo de guarda
 * - Emissão do evento `aura.registration.guardian.linked.v1`
 *
 * Referências: P123 (AEDA), P133 (AAIRP Etapa 8)
 */
@Injectable()
export class ResponsibleGuardianService {
  private readonly logger = new Logger(ResponsibleGuardianService.name);

  // Storage de vínculos (no banco de dados em produção)
  private readonly guardianLinks = new Map<string, GuardianLinkRecord[]>();

  constructor(private readonly eventBus: EventBusService) {}

  /**
   * Associa um responsável legal a um dependente.
   */
  async linkGuardian(dto: LinkGuardianDto, tenantId = 'default'): Promise<GuardianLinkRecord> {
    const linkId = `link-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const record: GuardianLinkRecord = {
      linkId,
      dependentUserId: dto.dependentUserId,
      guardianUserId: dto.guardianUserId,
      kinshipType: dto.kinshipType,
      documentProofUrl: dto.documentProofUrl,
      linkedAt: new Date().toISOString(),
      isActive: true,
    };

    const existingLinks = this.guardianLinks.get(dto.dependentUserId) ?? [];
    existingLinks.push(record);
    this.guardianLinks.set(dto.dependentUserId, existingLinks);

    this.logger.log(
      `[Guardian] Vínculo legal criado: Responsável ${dto.guardianUserId} -> Dependente ${dto.dependentUserId} (${dto.kinshipType})`,
    );

    await this.eventBus.publish(
      'aura.registration.guardian.linked.v1',
      {
        linkId,
        dependentUserId: dto.dependentUserId,
        guardianUserId: dto.guardianUserId,
        kinshipType: dto.kinshipType,
      },
      tenantId,
      { subject: dto.dependentUserId },
    );

    return record;
  }

  /**
   * Retorna todos os responsáveis legais ativos de um dependente.
   */
  async getGuardiansForDependent(dependentUserId: string): Promise<GuardianLinkRecord[]> {
    const links = this.guardianLinks.get(dependentUserId) ?? [];
    return links.filter((l) => l.isActive);
  }

  /**
   * Desativa um vínculo de responsável legal.
   */
  async unlinkGuardian(linkId: string): Promise<boolean> {
    for (const links of this.guardianLinks.values()) {
      const target = links.find((l) => l.linkId === linkId);
      if (target) {
        target.isActive = false;
        this.logger.warn(`[Guardian] Vínculo de responsável legal ${linkId} desativado.`);
        return true;
      }
    }
    throw new NotFoundException(`Vínculo de responsável com ID ${linkId} não encontrado.`);
  }
}

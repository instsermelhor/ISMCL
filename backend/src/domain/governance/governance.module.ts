import { Module } from '@nestjs/common';
import { GovernanceController } from './controllers/governance.controller';
import { EnterpriseRiskGovernanceService } from './services/enterprise-risk-governance.service';
import { StrategicPlanningGrcService } from './services/strategic-planning-grc.service';
import { EventBusModule } from '../../events/event-bus.module';

/**
 * GovernanceModule — Plataforma Corporativa de Governança, Riscos, Compliance e Gestão Estratégica (AEGRC)
 *
 * Integra:
 * - EnterpriseRiskGovernanceService (ERM: Riscos em 9 categorias + Risk Score + Controles Internos + Políticas com SoD)
 * - StrategicPlanningGrcService (Planejamento Estratégico + OKRs + Comitês com Assinatura Digital + GRC Dashboard)
 *
 * Princípios:
 * - Segregação de Funções (SoD): publicação de políticas exige aprovação SUPER_ADMIN
 * - Imutabilidade: todas as deliberações de comitês são assinadas digitalmente com SHA-256
 * - Orientado a Eventos: CloudEvents para todos os eventos de governança
 * - Zero Trust + RBAC + ABAC integrados ao Identity Fabric (P132)
 *
 * Referências: P107 AEIAT, P116 AEGRC, P144 AEGRC
 */
@Module({
  imports: [EventBusModule],
  controllers: [GovernanceController],
  providers: [
    EnterpriseRiskGovernanceService,
    StrategicPlanningGrcService,
  ],
  exports: [
    EnterpriseRiskGovernanceService,
    StrategicPlanningGrcService,
  ],
})
export class GovernanceModule {}

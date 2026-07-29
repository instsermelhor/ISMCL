import { Module } from '@nestjs/common';
import { ContentManagementController } from './controllers/content-management.controller';
import { EnterpriseContentManagementService } from './services/enterprise-content-management.service';
import { RetentionSearchService } from './services/retention-search.service';
import { EventBusModule } from '../../events/event-bus.module';

/**
 * ContentManagementModule — Plataforma Corporativa de Gestão Documental, Arquivamento Digital e Governança da Informação (AECM-KG)
 *
 * Integra:
 * - EnterpriseContentManagementService (Repositório ECM + Versionamento Imutável SHA-256 + Classificação da Informação)
 * - RetentionSearchService (Enterprise Search + Arquivo Digital de Longo Prazo + Tabela de Temporalidade e Descarte Seguro)
 *
 * Referências: P115 AEDM, P145 AECM-KG
 */
@Module({
  imports: [EventBusModule],
  controllers: [ContentManagementController],
  providers: [
    EnterpriseContentManagementService,
    RetentionSearchService,
  ],
  exports: [
    EnterpriseContentManagementService,
    RetentionSearchService,
  ],
})
export class ContentManagementModule {}

import { Module } from '@nestjs/common';
import { DocumentsController } from './controllers/documents.controller';
import { DigitalPrescriptionService } from './services/digital-prescription.service';
import { TemplateManagementService } from './services/template-management.service';
import { DocumentDeliveryService } from './services/document-delivery.service';
import { TrustServicesEngine } from './engines/trust-services.engine';
import { EventBusModule } from '../../events/event-bus.module';

/**
 * DocumentsModule — Plataforma de Prescrição Digital, Documentos Clínicos e Serviços de Confiança (ADPCDT)
 *
 * Integra:
 * - DigitalPrescriptionService (emissão + assinatura + validação)
 * - TemplateManagementService (templates parametrizáveis versionados)
 * - DocumentDeliveryService (distribuição multicanal segura)
 * - TrustServicesEngine (TSA + SHA-256 + integridade)
 *
 * Referências: CFM 2.299/2021, CFP 15/2021, LGPD Art.11, P138 ADPCDT
 */
@Module({
  imports: [EventBusModule],
  controllers: [DocumentsController],
  providers: [
    DigitalPrescriptionService,
    TemplateManagementService,
    DocumentDeliveryService,
    TrustServicesEngine,
  ],
  exports: [
    DigitalPrescriptionService,
    TemplateManagementService,
    DocumentDeliveryService,
    TrustServicesEngine,
  ],
})
export class DocumentsModule {}

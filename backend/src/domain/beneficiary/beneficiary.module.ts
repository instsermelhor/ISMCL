import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EventBusModule } from '../../events/event-bus.module';
import { AuditService } from '../../audit/audit.service';
import { BeneficiaryController } from './controllers/beneficiary.controller';
import { BeneficiaryService } from './services/beneficiary.service';

/**
 * BeneficiaryModule — Domínio de Gestão de Beneficiários e Proteção MCSI
 *
 * Integra cadastro, consulta, atualização e linha do tempo de beneficiários
 * com enforcement de RLS MCSI Nível 4 (GAP-P1-01 / GAP-P2-04).
 *
 * Referências: PRD-AURA-001 (FR-AURA-010 a FR-AURA-014), REMEDIATION-AURA-001 (R2-04)
 */
@Module({
  imports: [PrismaModule, EventBusModule],
  controllers: [BeneficiaryController],
  providers: [BeneficiaryService, AuditService],
  exports: [BeneficiaryService],
})
export class BeneficiaryModule {}

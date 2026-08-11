import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EventBusModule } from '../../events/event-bus.module';
import { AuditService } from '../../audit/audit.service';
import { ProfessionalController } from './controllers/professional.controller';
import { ProfessionalService } from './services/professional.service';

/**
 * ProfessionalModule — Domínio de Gestão de Profissionais e Corpo Técnico
 *
 * Gerencia busca, perfis de profissionais de saúde e assistência social,
 * vínculos institucionais e agendas de disponibilidade.
 *
 * Referências: PRD-AURA-001, REMEDIATION-AURA-001 (R2-04)
 */
@Module({
  imports: [PrismaModule, EventBusModule],
  controllers: [ProfessionalController],
  providers: [ProfessionalService, AuditService],
  exports: [ProfessionalService],
})
export class ProfessionalModule {}

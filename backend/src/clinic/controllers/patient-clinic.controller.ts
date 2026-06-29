import { Controller, Get, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { PortalAccessGuard } from '../../auth/guards/portal-access.guard.ts';
import { SetMetadata } from '@nestjs/common';
import { Request } from 'express';

export const RequirePortal = (portal: 'ADMIN' | 'CLINIC') => SetMetadata('portal', portal);

/**
 * CLINIC CONTROLLER - VISÃO CLÍNICA DO PACIENTE (BENEFICIÁRIO)
 * Exclusivo para o portal clínico (profissional.institutosermelhor.org.br)
 */
@Controller('clinic/patients')
@UseGuards(PortalAccessGuard)
@RequirePortal('CLINIC')
export class PatientClinicController {
  
  /**
   * Retorna a visão clínica do beneficiário para um psicólogo/psiquiatra.
   * Aplica ABAC (Attribute-Based Access Control) para garantir que o profissional 
   * está alocado ao "Caso" do beneficiário.
   */
  @Get(':id/medical-record')
  async getPatientClinicalRecord(@Param('id') patientId: string, @Req() req: Request) {
    const professionalId = req.user['id'];

    // 1. ABAC: Verifica se o profissional é voluntário ativo no CASO deste paciente
    const hasActiveCase = await this.caseService.verifyProfessionalAccess(patientId, professionalId);
    
    if (!hasActiveCase) {
      // Falha de privilégio: Gera incidente de segurança
      await this.auditService.logSecurityIncident({
        actorId: professionalId,
        type: 'UNAUTHORIZED_CLINICAL_ACCESS_ATTEMPT',
        targetEntityId: patientId,
      });
      throw new ForbiddenException('Sigilo Preservado: Você não possui vínculo clínico ativo com este paciente.');
    }

    // 2. Log de visualização legítima de prontuário (Trilha de Auditoria Obrigatória LGPD/CFM)
    await this.auditService.log({
      actorId: professionalId,
      action: 'READ_MEDICAL_RECORD',
      targetEntityId: patientId,
      justification: 'Rotina Assistencial'
    });

    // 3. Retorna a união do Rosto do Cadastro Mestre + Prontuários (Ocultando finanças e gestão)
    const clinicalProfile = await this.beneficiaryService.getClinicalProfile(patientId);
    const evolutions = await this.medicalRecordService.getPatientEvolutions(patientId);

    return {
      profile: clinicalProfile,
      records: evolutions
    };
  }
}

// Mock services para evitar erros de compilação na demonstração
class AuditService { 
  async log(data: any) {} 
  async logSecurityIncident(data: any) {}
}
class CaseService { async verifyProfessionalAccess(patientId: string, professionalId: string) { return true; } }
class BeneficiaryService { async getClinicalProfile(id: string) { return {}; } }
class MedicalRecordService { async getPatientEvolutions(id: string) { return []; } }

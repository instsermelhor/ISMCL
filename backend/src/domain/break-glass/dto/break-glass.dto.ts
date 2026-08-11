import { IsString, IsNotEmpty, IsEnum, IsUUID, MinLength } from 'class-validator';

// Tipos de emergência válidos para justificar break-glass
export enum EmergencyType {
  RISCO_VIDA = 'RISCO_VIDA',
  SURTO_AGUDO = 'SURTO_AGUDO',
  DESAPARECIMENTO = 'DESAPARECIMENTO',
  CRISE_SUICIDA = 'CRISE_SUICIDA',
  OUTRO = 'OUTRO',
}

export enum BreakGlassStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  DENIED = 'DENIED',
}

/**
 * DTO para solicitar acesso Break-Glass a um beneficiário MCSI-4.
 * A justificativa mínima de 30 caracteres é obrigatória por política MCSI.
 */
export class RequestBreakGlassDto {
  @IsUUID()
  @IsNotEmpty()
  beneficiaryId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(30, { message: 'A justificativa clínica deve ter no mínimo 30 caracteres.' })
  justification: string;

  @IsEnum(EmergencyType, { message: 'Tipo de emergência inválido. Use: RISCO_VIDA, SURTO_AGUDO, DESAPARECIMENTO, CRISE_SUICIDA, OUTRO.' })
  emergencyType: EmergencyType;
}

/**
 * DTO para resposta de uma sessão Break-Glass ativa.
 */
export interface BreakGlassSessionResponseDto {
  sessionId: string;
  status: BreakGlassStatus;
  beneficiaryId: string;
  professionalId: string;
  emergencyType: EmergencyType;
  justification: string;
  approvedAt: string | null;
  expiresAt: string | null;
  auditLogId: string | null;
  notificationSentAt: string | null;
}

/**
 * Payload do evento CloudEvent publicado no EventBus.
 * Tipo: aura.security.break_glass.initiated.v1
 */
export interface BreakGlassInitiatedEventPayload {
  sessionId: string;
  professionalId: string;
  professionalName: string;
  beneficiaryId: string;
  beneficiaryName: string;
  justification: string;
  emergencyType: EmergencyType;
  ipAddress: string;
  requestedAt: string;
  expiresAt: string;
  tenantId: string;
}

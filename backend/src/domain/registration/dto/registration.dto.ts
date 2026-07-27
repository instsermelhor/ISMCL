import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsArray,
  IsBoolean,
  IsNumber,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TargetProfileType {
  BENEFICIARY = 'BENEFICIARY',
  PROFESSIONAL = 'PROFESSIONAL',
  VOLUNTEER = 'VOLUNTEER',
  GUARDIAN = 'GUARDIAN',
  COLLABORATOR = 'COLLABORATOR',
  PARTNER_INSTITUTION = 'PARTNER_INSTITUTION',
  SUPPLIER = 'SUPPLIER',
}

export enum RiskLevel {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class StartRegistrationDto {
  @ApiProperty({ description: 'Perfil de destino', enum: TargetProfileType })
  @IsEnum(TargetProfileType)
  profileType: TargetProfileType;

  @ApiPropertyOptional({ description: 'ID do Usuário autenticado se já possuir conta' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Dados iniciais informados' })
  @IsOptional()
  @IsObject()
  initialData?: Record<string, unknown>;
}

export class SubmitRegistrationDto {
  @ApiProperty({ description: 'ID da sessão de cadastro' })
  @IsUUID()
  registrationId: string;

  @ApiProperty({ description: 'Respostas dos questionários e campos dos formulários dinâmicos' })
  @IsObject()
  formData: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Documentos anexados (URLs ou S3 keys)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}

export class EvaluateEligibilityDto {
  @ApiProperty({ description: 'ID do cadastro ou beneficiário' })
  @IsUUID()
  registrationId: string;

  @ApiProperty({ description: 'Renda familiar per capita' })
  @IsNumber()
  monthlyIncome: number;

  @ApiProperty({ description: 'Quantidade de membros no núcleo familiar' })
  @IsNumber()
  familyMembersCount: number;

  @ApiProperty({ description: 'UF e Município de residência', example: 'SP - São Paulo' })
  @IsString()
  location: string;

  @ApiPropertyOptional({ description: 'Indicadores de vulnerabilidade social ativos' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  vulnerabilityFactors?: string[];
}

export class ClassifyRiskDto {
  @ApiProperty({ description: 'ID do cadastrado' })
  @IsUUID()
  registrationId: string;

  @ApiProperty({ description: 'Dimensão clínica (0-100)' })
  @IsNumber()
  clinicalScore: number;

  @ApiProperty({ description: 'Dimensão psicossocial (0-100)' })
  @IsNumber()
  psychosocialScore: number;

  @ApiProperty({ description: 'Dimensão de vulnerabilidade (0-100)' })
  @IsNumber()
  vulnerabilityScore: number;

  @ApiPropertyOptional({ description: 'Observações do avaliador profissional' })
  @IsOptional()
  @IsString()
  evaluatorNotes?: string;
}

export class GrantConsentDto {
  @ApiProperty({ description: 'ID do usuário titular' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Termo de consentimento aceito', example: 'TERMO_LGPD_TRATAMENTO_DADOS_v1' })
  @IsString()
  termIdentifier: string;

  @ApiProperty({ description: 'Aceito?' })
  @IsBoolean()
  accepted: boolean;

  @ApiPropertyOptional({ description: 'Endereço IP no momento do aceite' })
  @IsOptional()
  @IsString()
  ipAddress?: string;
}

export class LinkGuardianDto {
  @ApiProperty({ description: 'ID do Dependente' })
  @IsUUID()
  dependentUserId: string;

  @ApiProperty({ description: 'ID do Responsável Legal' })
  @IsUUID()
  guardianUserId: string;

  @ApiProperty({ description: 'Tipo de vínculo legal', example: 'PAI_MAE' })
  @IsString()
  kinshipType: 'PAI_MAE' | 'TUTOR' | 'CURADOR' | 'PROCURADOR' | 'GUARDA_COMPARTILHADA';

  @ApiPropertyOptional({ description: 'Documento comprobatório da tutela/guarda' })
  @IsOptional()
  @IsString()
  documentProofUrl?: string;
}

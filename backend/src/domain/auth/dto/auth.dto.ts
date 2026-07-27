import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsUUID,
  Matches,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { AuraRole } from '../../../shared/decorators/roles.decorator';

export class LoginDto {
  @ApiProperty({ description: 'E-mail do usuário', example: 'usuario@sermelhor.org.br' })
  @IsEmail({}, { message: 'email|E-mail em formato inválido.' })
  email: string;

  @ApiProperty({ description: 'Senha do usuário', example: 'Senha@Forte123!' })
  @IsString({ message: 'password|Senha deve ser um texto.' })
  @MinLength(8, { message: 'password|Senha deve ter no mínimo 8 caracteres.' })
  password: string;

  @ApiPropertyOptional({ description: 'Código TOTP MFA se ativado', example: '123456' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/, { message: 'mfaCode|Código MFA deve conter 6 dígitos numéricos.' })
  mfaCode?: string;

  @ApiPropertyOptional({ description: 'Fingerprint do dispositivo para análise adaptativa de risco' })
  @IsOptional()
  @IsString()
  deviceFingerprint?: string;
}

export class RegisterUserDto {
  @ApiProperty({ description: 'Nome completo do usuário', example: 'Maria das Dores Silva' })
  @IsString()
  @MinLength(3, { message: 'fullName|Nome deve ter pelo menos 3 caracteres.' })
  fullName: string;

  @ApiProperty({ description: 'E-mail institucional/pessoal', example: 'maria.silva@sermelhor.org.br' })
  @IsEmail({}, { message: 'email|E-mail inválido.' })
  email: string;

  @ApiProperty({ description: 'CPF do usuário (apenas dígitos ou formatado)', example: '123.456.789-01' })
  @IsString()
  @Matches(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, { message: 'cpf|CPF em formato inválido.' })
  cpf: string;

  @ApiProperty({ description: 'Senha forte inicial', example: 'Senha@Forte123!' })
  @IsString()
  @MinLength(8, { message: 'password|Senha deve ter pelo menos 8 caracteres.' })
  password: string;

  @ApiPropertyOptional({ description: 'Telefone de contato', example: '(11) 99999-8888' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Role atribuído inicialmente', enum: AuraRole, default: AuraRole.BENEFICIARY })
  @IsOptional()
  @IsEnum(AuraRole)
  role?: AuraRole = AuraRole.BENEFICIARY;

  @ApiPropertyOptional({ description: 'ID da Organização/Unidade', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh Token JWT válido' })
  @IsString()
  refreshToken: string;
}

export class EnableMfaDto {
  @ApiProperty({ description: 'Segredo TOTP ou método selecionado', enum: ['TOTP', 'WEBAUTHN', 'PUSH'] })
  @IsEnum(['TOTP', 'WEBAUTHN', 'PUSH'])
  method: 'TOTP' | 'WEBAUTHN' | 'PUSH';
}

export class VerifyMfaDto {
  @ApiProperty({ description: 'Código de 6 dígitos gerado pelo aplicativo autenticador' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'code|Código MFA inválido.' })
  code: string;
}

export class CreateRoleDto {
  @ApiProperty({ description: 'Nome identificador da Role', example: 'CLINICAL_COORDINATOR' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Descrição da atribuição', example: 'Coordenador da Equipe Multidisciplinar Clínica' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Lista de permissões concedidas', example: ['clinical:ehr:read', 'clinical:ehr:write'] })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}

export class EvaluatePolicyDto {
  @ApiProperty({ description: 'ID do Usuário solicitante' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Recurso alvo da ação', example: 'medical_record:123' })
  @IsString()
  resource: string;

  @ApiProperty({ description: 'Ação pretendida', example: 'READ' })
  @IsString()
  action: string;

  @ApiPropertyOptional({ description: 'Contexto do dispositivo/IP/localização' })
  @IsOptional()
  context?: Record<string, unknown>;
}

import { Injectable, Logger } from '@nestjs/common';
import { TargetProfileType } from '../dto/registration.dto';

export interface FormFieldSchema {
  id: string;
  name: string;
  label: string;
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'RADIO' | 'CHECKBOX' | 'FILE' | 'TEXTAREA';
  required: boolean;
  mask?: string;
  options?: Array<{ label: string; value: string | number }>;
  dependsOnField?: string;
  dependsOnValue?: unknown;
  validationRegex?: string;
  helpText?: string;
}

export interface FormGroupSchema {
  id: string;
  title: string;
  description?: string;
  fields: FormFieldSchema[];
}

export interface FormTabSchema {
  id: string;
  title: string;
  icon?: string;
  groups: FormGroupSchema[];
}

export interface DynamicFormSchema {
  id: string;
  profileType: TargetProfileType;
  version: number;
  title: string;
  tabs: FormTabSchema[];
  createdAt: string;
}

/**
 * DynamicFormsEngine — Motor de Formulários Dinâmicos e Parametrizáveis
 *
 * Elimina código fixo (hardcoded) para formulários.
 * Permite que o Administrador configure abas, grupos de campos, máscaras,
 * visibilidade condicional e regras de validação via API/Admin UI.
 *
 * Referências: P110 (AEWBPM), P133 (AAIRP Etapa 3)
 */
@Injectable()
export class DynamicFormsEngine {
  private readonly logger = new Logger(DynamicFormsEngine.name);

  // Cache/Storage de schemas de formulário por perfil
  private readonly schemas = new Map<TargetProfileType, DynamicFormSchema>();

  constructor() {
    this.seedDefaultFormSchemas();
  }

  /**
   * Retorna o schema dinâmico ativo para um perfil de usuário.
   */
  getFormSchema(profileType: TargetProfileType): DynamicFormSchema {
    const schema = this.schemas.get(profileType);
    if (!schema) {
      return this.generateFallbackSchema(profileType);
    }
    return schema;
  }

  /**
   * Salva ou atualiza a configuração de formulário dinâmico para um perfil.
   */
  saveFormSchema(schema: DynamicFormSchema): void {
    this.schemas.set(schema.profileType, schema);
    this.logger.log(
      `[DynamicFormsEngine] Schema de formulário atualizado para ${schema.profileType} (v${schema.version})`,
    );
  }

  /**
   * Avalia a visibilidade condicional dos campos com base nas respostas atuais.
   */
  evaluateVisibleFields(
    schema: DynamicFormSchema,
    currentAnswers: Record<string, unknown>,
  ): FormFieldSchema[] {
    const visibleFields: FormFieldSchema[] = [];

    for (const tab of schema.tabs) {
      for (const group of tab.groups) {
        for (const field of group.fields) {
          if (!field.dependsOnField) {
            visibleFields.push(field);
            continue;
          }

          const answerValue = currentAnswers[field.dependsOnField];
          if (answerValue === field.dependsOnValue) {
            visibleFields.push(field);
          }
        }
      }
    }

    return visibleFields;
  }

  private seedDefaultFormSchemas(): void {
    const beneficiarySchema: DynamicFormSchema = {
      id: 'schema-beneficiary-v1',
      profileType: TargetProfileType.BENEFICIARY,
      version: 1,
      title: 'Ficha de Inscrição — Beneficiário',
      createdAt: new Date().toISOString(),
      tabs: [
        {
          id: 'tab-identificacao',
          title: 'Dados Pessoais',
          icon: 'user',
          groups: [
            {
              id: 'group-basico',
              title: 'Identificação Básica',
              fields: [
                { id: 'f-nome', name: 'nomeSocial', label: 'Nome Social / Preferencial', type: 'TEXT', required: false },
                { id: 'f-nasc', name: 'dataNascimento', label: 'Data de Nascimento', type: 'DATE', required: true },
                { id: 'f-genero', name: 'genero', label: 'Gênero', type: 'SELECT', required: true, options: [
                  { label: 'Feminino', value: 'FEMALE' },
                  { label: 'Masculino', value: 'MALE' },
                  { label: 'Outro / Não Informar', value: 'OTHER' },
                ]},
              ],
            },
            {
              id: 'group-social',
              title: 'Informações Socioeconômicas',
              fields: [
                { id: 'f-renda', name: 'rendaFamiliar', label: 'Renda Familiar Estimada (R$)', type: 'NUMBER', required: true },
                { id: 'f-beneficio', name: 'recebeBeneficio', label: 'Recebe benefício social (BPC/Bolsa Família)?', type: 'RADIO', required: true, options: [
                  { label: 'Sim', value: 'SIM' },
                  { label: 'Não', value: 'NAO' },
                ]},
                { id: 'f-beneficio-detalhe', name: 'detalheBeneficio', label: 'Qual benefício?', type: 'TEXT', required: true, dependsOnField: 'recebeBeneficio', dependsOnValue: 'SIM' },
              ],
            },
          ],
        },
      ],
    };

    this.schemas.set(TargetProfileType.BENEFICIARY, beneficiarySchema);
  }

  private generateFallbackSchema(profileType: TargetProfileType): DynamicFormSchema {
    return {
      id: `schema-${profileType.toLowerCase()}-default`,
      profileType,
      version: 1,
      title: `Cadastro de ${profileType}`,
      createdAt: new Date().toISOString(),
      tabs: [
        {
          id: 'tab-geral',
          title: 'Geral',
          groups: [
            {
              id: 'group-main',
              title: 'Informações de Cadastro',
              fields: [
                { id: 'f-observacoes', name: 'observacoes', label: 'Observações de Cadastro', type: 'TEXTAREA', required: false },
              ],
            },
          ],
        },
      ],
    };
  }
}

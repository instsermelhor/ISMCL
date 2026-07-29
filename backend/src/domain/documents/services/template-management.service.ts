import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  CreateTemplateDto,
  DocumentType,
} from '../dto/documents.dto';

export interface DocumentTemplate {
  templateId: string;
  name: string;
  documentType: DocumentType;
  content: string;       // HTML/Markdown com variáveis {{beneficiary_name}}, {{date}} etc.
  version: number;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * TemplateManagementService — Motor Corporativo de Modelos de Documentos Clínicos
 *
 * Funcionalidades:
 * - Criação e versionamento de templates parametrizáveis (HTML/Markdown com variáveis {{var}})
 * - Suporte a todos os tipos de documento clínico/social/institucional
 * - Administração exclusiva pelo Super Administrador
 * - Renderização de templates com interpolação de variáveis
 * - Retorno do template padrão por tipo quando não especificado
 *
 * Referências: P107 AEIATP (RBAC), P138 ADPCDT Etapas 4, 3
 */
@Injectable()
export class TemplateManagementService {
  private readonly logger = new Logger(TemplateManagementService.name);
  private readonly templates = new Map<string, DocumentTemplate>();

  constructor() {
    this.seedDefaultTemplates();
  }

  /**
   * Templates padrão pré-carregados para os tipos de documento mais comuns.
   */
  private seedDefaultTemplates(): void {
    const defaults: Array<{ type: DocumentType; name: string; content: string }> = [
      {
        type: DocumentType.PRESCRIPTION,
        name: 'Receita Médica/Psiquiátrica Padrão',
        content: `RECEITA MÉDICA — INSTITUTO SER MELHOR\n\nPaciente: {{beneficiary_name}}\nData: {{date}}\n\n{{items}}\n\nCID-10: {{icd_code}}\n\n___________________________\n{{professional_name}}\n{{professional_crp_crm}}\nAss. Digital: {{signature_hash}}`,
      },
      {
        type: DocumentType.MEDICAL_CERTIFICATE,
        name: 'Atestado Médico/Psicológico Padrão',
        content: `ATESTADO — INSTITUTO SER MELHOR\n\nAtesto que {{beneficiary_name}}, compareceu para atendimento nesta unidade em {{date}}.\n\nCID-10: {{icd_code}}\n\n{{content}}\n\n___________________________\n{{professional_name}} — {{professional_crp_crm}}`,
      },
      {
        type: DocumentType.REFERRAL,
        name: 'Encaminhamento Padrão',
        content: `ENCAMINHAMENTO — INSTITUTO SER MELHOR\n\nEncaminho {{beneficiary_name}} para avaliação/tratamento conforme indicação clínica.\n\n{{content}}\n\nData: {{date}}\n\n___________________________\n{{professional_name}} — {{professional_crp_crm}}`,
      },
      {
        type: DocumentType.PSYCHOLOGICAL_REPORT,
        name: 'Parecer Psicológico Padrão',
        content: `PARECER PSICOLÓGICO — INSTITUTO SER MELHOR\n\nBeneficiário(a): {{beneficiary_name}}\nData: {{date}}\n\n{{content}}\n\n___________________________\n{{professional_name}}\n{{professional_crp_crm}}`,
      },
    ];

    for (const d of defaults) {
      const templateId = randomUUID();
      const now = new Date().toISOString();
      this.templates.set(templateId, {
        templateId,
        name: d.name,
        documentType: d.type,
        content: d.content,
        version: 1,
        isActive: true,
        createdBy: 'system',
        createdAt: now,
        updatedAt: now,
      });
    }

    this.logger.log(`[Templates] ${this.templates.size} templates padrão carregados.`);
  }

  /**
   * Cria um novo template (ou nova versão de template existente).
   */
  async create(dto: CreateTemplateDto, createdBy: string): Promise<DocumentTemplate> {
    const templateId = randomUUID();
    const now = new Date().toISOString();
    const tpl: DocumentTemplate = {
      templateId,
      name: dto.name,
      documentType: dto.documentType,
      content: dto.content,
      version: 1,
      isActive: true,
      metadata: dto.metadata,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };
    this.templates.set(templateId, tpl);
    this.logger.log(`[Templates] Template criado: "${dto.name}" (${dto.documentType})`);
    return tpl;
  }

  /**
   * Renderiza um template interpolando variáveis {{variavel}} com valores reais.
   */
  render(templateId: string, variables: Record<string, string>): string {
    const tpl = this.templates.get(templateId);
    if (!tpl) return '';

    let rendered = tpl.content;
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replaceAll(`{{${key}}}`, value);
    }
    return rendered;
  }

  /**
   * Localiza o template padrão ativo para um tipo de documento.
   */
  findDefaultForType(documentType: DocumentType): DocumentTemplate | undefined {
    return [...this.templates.values()].find(
      (t) => t.documentType === documentType && t.isActive && t.createdBy === 'system',
    );
  }

  listAll(): DocumentTemplate[] {
    return [...this.templates.values()].sort((a, b) => a.name.localeCompare(b.name));
  }
}

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  CreateCommunicationAccountDto,
  UpdateCommunicationAccountDto,
  UpdateCommunicationProviderDto,
  CreateCommunicationTemplateDto,
  UpdateCommunicationTemplateDto,
} from '../dto/actg.dto';

export interface AdminProvider {
  id: string;
  name: string;
  type: string;
  status: string;
  isEnabled: boolean;
  supportsVideo: boolean;
  supportsAudio: boolean;
  supportsChat: boolean;
  supportsNotify: boolean;
  configSchema?: Record<string, unknown>;
  accountsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAccount {
  id: string;
  providerId: string;
  providerName: string;
  name: string;
  environment: string;
  vaultPath: string;
  webhookUrl?: string;
  isActive: boolean;
  lastHealthCheck?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminTemplate {
  id: string;
  providerId?: string;
  name: string;
  eventType: string;
  channel: string;
  language: string;
  subject?: string;
  body: string;
  isActive: boolean;
  mcsiMaxLevel: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * ACTGAdminService — Gestão Administrativa do ACTG
 *
 * Gerencia a configuração de Provedores, Contas (integradas ao Vault)
 * e Templates de notificação pelo Painel Administrativo.
 *
 * Referência: ADR-188, Prompt 188
 */
@Injectable()
export class ACTGAdminService {
  private readonly logger = new Logger(ACTGAdminService.name);

  // In-memory initial data (stubs for dev/test)
  private providers: AdminProvider[] = [
    {
      id: 'prov-google-meet',
      name: 'Google Meet (Workspace)',
      type: 'GOOGLE_MEET',
      status: 'ACTIVE',
      isEnabled: true,
      supportsVideo: true,
      supportsAudio: true,
      supportsChat: true,
      supportsNotify: false,
      configSchema: { calendarId: 'primary', scopes: ['calendar.events'] },
      accountsCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prov-teams',
      name: 'Microsoft Teams (Graph API)',
      type: 'TEAMS',
      status: 'ACTIVE',
      isEnabled: true,
      supportsVideo: true,
      supportsAudio: true,
      supportsChat: true,
      supportsNotify: false,
      configSchema: { tenantId: 'string', clientId: 'string' },
      accountsCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prov-whatsapp',
      name: 'WhatsApp Business Platform (Meta)',
      type: 'WHATSAPP_BUSINESS',
      status: 'ACTIVE',
      isEnabled: true,
      supportsVideo: false,
      supportsAudio: false,
      supportsChat: true,
      supportsNotify: true,
      configSchema: { phoneNumberId: 'string', apiVersion: 'v19.0' },
      accountsCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prov-webrtc',
      name: 'Sala Virtual Aura (Native WebRTC)',
      type: 'WEBRTC_NATIVE',
      status: 'ACTIVE',
      isEnabled: true,
      supportsVideo: true,
      supportsAudio: true,
      supportsChat: true,
      supportsNotify: false,
      configSchema: { turnServerUrl: 'turns:turn.aura.org:5349' },
      accountsCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  private accounts: AdminAccount[] = [
    {
      id: 'acc-google-1',
      providerId: 'prov-google-meet',
      providerName: 'Google Meet (Workspace)',
      name: 'Conta Principal Google Workspace',
      environment: 'PRODUCTION',
      vaultPath: 'secret/data/aura/prod/google-meet-sa',
      webhookUrl: 'https://api.aura.org/api/v1/actg/webhooks/GOOGLE_MEET',
      isActive: true,
      lastHealthCheck: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'acc-teams-1',
      providerId: 'prov-teams',
      providerName: 'Microsoft Teams (Graph API)',
      name: 'Tenant Principal Office 365',
      environment: 'PRODUCTION',
      vaultPath: 'secret/data/aura/prod/teams-app-credentials',
      webhookUrl: 'https://api.aura.org/api/v1/actg/webhooks/TEAMS',
      isActive: true,
      lastHealthCheck: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'acc-whatsapp-1',
      providerId: 'prov-whatsapp',
      providerName: 'WhatsApp Business Platform (Meta)',
      name: 'Conta Institucional Meta Cloud API',
      environment: 'PRODUCTION',
      vaultPath: 'secret/data/aura/prod/whatsapp-meta-token',
      webhookUrl: 'https://api.aura.org/api/v1/actg/webhooks/WHATSAPP_BUSINESS',
      isActive: true,
      lastHealthCheck: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  private templates: AdminTemplate[] = [
    {
      id: 'tmpl-1',
      name: 'Confirmação de Agendamento (WhatsApp)',
      eventType: 'APPOINTMENT_CONFIRMED',
      channel: 'WHATSAPP',
      language: 'pt_BR',
      body: 'Olá {name}, seu atendimento no Projeto Aura foi agendado para {date} às {time} com {professional}. Acesse pelo link: {link}',
      isActive: true,
      mcsiMaxLevel: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tmpl-2',
      name: 'Lembrete 24h (WhatsApp)',
      eventType: 'REMINDER_24H',
      channel: 'WHATSAPP',
      language: 'pt_BR',
      body: 'Lembrete Aura: Seu atendimento é amanhã, {date} às {time}. Link de acesso: {link}',
      isActive: true,
      mcsiMaxLevel: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tmpl-3',
      name: 'Confirmação por E-mail (Neutro)',
      eventType: 'APPOINTMENT_CONFIRMED',
      channel: 'EMAIL',
      language: 'pt_BR',
      subject: 'Projeto Aura — Agendamento de Atendimento',
      body: 'Prezado(a) {name},\n\nSeu atendimento institucional foi confirmado para {date} às {time}.\n\nAcesse a sala virtual em: {link}\n\nAtenciosamente,\nEquipe Projeto Aura',
      isActive: true,
      mcsiMaxLevel: 4,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // ── Provedores ─────────────────────────────────────────────────────────────

  listProviders(): AdminProvider[] {
    return this.providers;
  }

  updateProvider(id: string, dto: UpdateCommunicationProviderDto): AdminProvider {
    const prov = this.providers.find((p) => p.id === id);
    if (!prov) throw new NotFoundException(`Provedor ${id} não encontrado`);

    if (dto.isEnabled !== undefined) prov.isEnabled = dto.isEnabled;
    if (dto.status !== undefined) prov.status = dto.status;
    if (dto.configSchema !== undefined) prov.configSchema = dto.configSchema;
    prov.updatedAt = new Date().toISOString();

    this.logger.log(`[ACTG Admin] Provedor ${prov.name} atualizado (isEnabled: ${prov.isEnabled})`);
    return prov;
  }

  // ── Contas de Comunicação ──────────────────────────────────────────────────

  listAccounts(): AdminAccount[] {
    return this.accounts;
  }

  createAccount(dto: CreateCommunicationAccountDto): AdminAccount {
    const provider = this.providers.find((p) => p.id === dto.providerId);
    const providerName = provider?.name ?? dto.providerId;

    const newAccount: AdminAccount = {
      id: `acc-${randomUUID().substring(0, 8)}`,
      providerId: dto.providerId,
      providerName,
      name: dto.name,
      environment: dto.environment ?? 'PRODUCTION',
      vaultPath: dto.vaultPath,
      webhookUrl: dto.webhookUrl,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.accounts.push(newAccount);

    if (provider) {
      provider.accountsCount += 1;
    }

    this.logger.log(`[ACTG Admin] ✅ Nova conta criada: ${newAccount.name} (${newAccount.vaultPath})`);
    return newAccount;
  }

  updateAccount(id: string, dto: UpdateCommunicationAccountDto): AdminAccount {
    const acc = this.accounts.find((a) => a.id === id);
    if (!acc) throw new NotFoundException(`Conta ${id} não encontrada`);

    if (dto.name !== undefined) acc.name = dto.name;
    if (dto.environment !== undefined) acc.environment = dto.environment;
    if (dto.vaultPath !== undefined) acc.vaultPath = dto.vaultPath;
    if (dto.webhookUrl !== undefined) acc.webhookUrl = dto.webhookUrl;
    if (dto.isActive !== undefined) acc.isActive = dto.isActive;
    acc.updatedAt = new Date().toISOString();

    this.logger.log(`[ACTG Admin] Conta ${acc.name} atualizada`);
    return acc;
  }

  // ── Templates ──────────────────────────────────────────────────────────────

  listTemplates(): AdminTemplate[] {
    return this.templates;
  }

  createTemplate(dto: CreateCommunicationTemplateDto): AdminTemplate {
    const newTmpl: AdminTemplate = {
      id: `tmpl-${randomUUID().substring(0, 8)}`,
      providerId: dto.providerId,
      name: dto.name,
      eventType: dto.eventType,
      channel: dto.channel,
      language: dto.language ?? 'pt_BR',
      subject: dto.subject,
      body: dto.body,
      isActive: true,
      mcsiMaxLevel: dto.mcsiMaxLevel ?? 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.templates.push(newTmpl);
    this.logger.log(`[ACTG Admin] ✅ Novo template criado: ${newTmpl.name}`);
    return newTmpl;
  }

  updateTemplate(id: string, dto: UpdateCommunicationTemplateDto): AdminTemplate {
    const tmpl = this.templates.find((t) => t.id === id);
    if (!tmpl) throw new NotFoundException(`Template ${id} não encontrado`);

    if (dto.name !== undefined) tmpl.name = dto.name;
    if (dto.subject !== undefined) tmpl.subject = dto.subject;
    if (dto.body !== undefined) tmpl.body = dto.body;
    if (dto.isActive !== undefined) tmpl.isActive = dto.isActive;
    if (dto.mcsiMaxLevel !== undefined) tmpl.mcsiMaxLevel = dto.mcsiMaxLevel;
    tmpl.updatedAt = new Date().toISOString();

    this.logger.log(`[ACTG Admin] Template ${tmpl.name} atualizado`);
    return tmpl;
  }
}

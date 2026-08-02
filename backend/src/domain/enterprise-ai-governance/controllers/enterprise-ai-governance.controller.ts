import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';

import { AIGovernanceService } from '../services/ai-governance.service';
import { AIRegistryService } from '../services/ai-registry.service';
import { ModelOpsService } from '../services/modelops.service';
import { LLMOpsService } from '../services/llmops.service';
import { PromptGovernanceService } from '../services/prompt-governance.service';
import { AIRiskManagementService } from '../services/ai-risk-management.service';
import { AIExplainabilityService } from '../services/ai-explainability.service';
import { AIEvaluationService } from '../services/ai-evaluation.service';
import { CognitiveAgentGovernanceService } from '../services/cognitive-agent-governance.service';
import { AIAuditService } from '../services/ai-audit.service';

import {
  RegisterAIAssetDto,
  RegisterPromptDto,
  EvaluateModelDto,
  RegisterAIRiskDto,
  ExplainDecisionDto,
  AIAssetType,
  PromptStatus,
  AIRiskCategory,
} from '../dto/enterprise-ai-governance.dto';

/**
 * EnterpriseAIGovernanceController — P175 EAIGP (Fase XXV)
 *
 * REST API da Plataforma Corporativa de Governança de IA, ModelOps, LLMOps
 * e Gestão de Agentes Cognitivos (EAIGP): Registro de Ativos de IA,
 * Deploy ModelOps, Configuração LLMOps, Governança de Prompts, Riscos de IA,
 * IA Explicável (XAI), Avaliação Contínua, Governança de Agentes Cognitivos
 * e Auditoria Imutável SHA-256.
 */
@ApiBearerAuth()
@ApiTags('EAIGP — Enterprise AI Governance, ModelOps & LLMOps (P175)')
@Controller('eaigp')
export class EnterpriseAIGovernanceController {
  constructor(
    private readonly govSvc: AIGovernanceService,
    private readonly registrySvc: AIRegistryService,
    private readonly modelOpsSvc: ModelOpsService,
    private readonly llmOpsSvc: LLMOpsService,
    private readonly promptSvc: PromptGovernanceService,
    private readonly riskSvc: AIRiskManagementService,
    private readonly xaiSvc: AIExplainabilityService,
    private readonly evalSvc: AIEvaluationService,
    private readonly cogAgentSvc: CognitiveAgentGovernanceService,
    private readonly auditSvc: AIAuditService,
  ) {}

  // ── AI REGISTRY ───────────────────────────────────────────────────────────

  @Post('registry/assets')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar ativo de IA (Modelo, LLM, Agente, Embedding, Prompt, RAG, Tool)' })
  registerAsset(@Body() dto: RegisterAIAssetDto) {
    return this.registrySvc.registerAsset(dto, 'API_USER');
  }

  @Post('registry/assets/:assetId/approve')
  @ApiOperation({ summary: 'Homologar ativo de IA para produção' })
  approveAsset(@Param('assetId') assetId: string, @Body('approvedBy') approvedBy: string) {
    return this.registrySvc.approveAsset(assetId, approvedBy ?? 'CAIO');
  }

  @Post('registry/assets/:assetId/publish')
  @ApiOperation({ summary: 'Publicar ativo de IA homologado em produção' })
  publishAsset(@Param('assetId') assetId: string, @Body('publishedBy') publishedBy: string) {
    return this.registrySvc.publishAsset(assetId, publishedBy ?? 'CAIO');
  }

  @Post('registry/assets/:assetId/deprecate')
  @ApiOperation({ summary: 'Deprecar ativo de IA' })
  deprecateAsset(@Param('assetId') assetId: string, @Body('deprecatedBy') deprecatedBy: string, @Body('reason') reason: string) {
    return this.registrySvc.deprecateAsset(assetId, deprecatedBy ?? 'CAIO', reason ?? 'Substituído');
  }

  @Get('registry/assets')
  @ApiOperation({ summary: 'Listar ativos de IA registrados' })
  @ApiQuery({ name: 'type', required: false, enum: AIAssetType })
  listAssets(@Query('type') type?: AIAssetType) {
    return this.registrySvc.listAssets(type);
  }

  @Get('registry/assets/:assetId')
  @ApiOperation({ summary: 'Obter ativo de IA pelo ID' })
  getAsset(@Param('assetId') assetId: string) {
    const a = this.registrySvc.getAsset(assetId);
    if (!a) return { error: 'Ativo de IA não encontrado', assetId };
    return a;
  }

  // ── MODELOPS ──────────────────────────────────────────────────────────────

  @Post('modelops/deploy')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Deploy de modelo (Training → Validation → Staging → Production)' })
  deployModel(
    @Body('assetId') assetId: string,
    @Body('version') version: string,
    @Body('stage') stage: any,
    @Body('deployedBy') deployedBy: string,
  ) {
    return this.modelOpsSvc.deploy(assetId, version ?? '1.0.0', stage ?? 'STAGING', deployedBy ?? 'MLOps');
  }

  @Post('modelops/:deploymentId/rollback')
  @ApiOperation({ summary: 'Rollback de deployment de modelo' })
  rollbackDeployment(@Param('deploymentId') deploymentId: string, @Body('rolledBackBy') rolledBackBy: string) {
    return this.modelOpsSvc.rollback(deploymentId, rolledBackBy ?? 'SRE');
  }

  @Get('modelops/deployments')
  @ApiOperation({ summary: 'Listar deployments de modelos' })
  @ApiQuery({ name: 'assetId', required: false })
  listDeployments(@Query('assetId') assetId?: string) {
    return this.modelOpsSvc.listDeployments(assetId);
  }

  // ── LLMOPS ────────────────────────────────────────────────────────────────

  @Post('llmops/configure')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Configurar LLM (temperatura, tokens, contexto, ferramentas, rate limits)' })
  configureLLM(
    @Body('modelId') modelId: string,
    @Body('provider') provider: string,
    @Body('temperature') temperature: number,
    @Body('maxTokens') maxTokens: number,
    @Body('contextWindowSize') contextWindowSize: number,
    @Body('memoryEnabled') memoryEnabled: boolean,
    @Body('tools') tools: string[],
    @Body('rateLimitRpm') rateLimitRpm: number,
    @Body('costPerMillionTokens') costPerMillionTokens: number,
  ) {
    return this.llmOpsSvc.configureLLM(
      modelId, provider ?? 'Google', temperature ?? 0.7, maxTokens ?? 8192,
      contextWindowSize ?? 128000, memoryEnabled ?? false, tools ?? [],
      rateLimitRpm ?? 60, costPerMillionTokens ?? 0.5, 'API_USER',
    );
  }

  @Post('llmops/:configId/switch-provider')
  @ApiOperation({ summary: 'Trocar provedor de LLM sem alterar regras de negócio' })
  switchProvider(@Param('configId') configId: string, @Body('newProvider') newProvider: string) {
    return this.llmOpsSvc.switchProvider(configId, newProvider, 'API_USER');
  }

  @Get('llmops/configs')
  @ApiOperation({ summary: 'Listar configurações LLM ativas' })
  listLLMConfigs() {
    return this.llmOpsSvc.listConfigs();
  }

  // ── PROMPT GOVERNANCE ─────────────────────────────────────────────────────

  @Post('prompts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar prompt oficial no catálogo governado' })
  registerPrompt(@Body() dto: RegisterPromptDto) {
    return this.promptSvc.registerPrompt(dto, 'API_USER');
  }

  @Post('prompts/:promptId/approve')
  @ApiOperation({ summary: 'Aprovar prompt oficial' })
  approvePrompt(@Param('promptId') promptId: string, @Body('approvedBy') approvedBy: string) {
    return this.promptSvc.approvePrompt(promptId, approvedBy ?? 'CAIO');
  }

  @Post('prompts/:promptId/activate')
  @ApiOperation({ summary: 'Ativar prompt aprovado para uso em produção' })
  activatePrompt(@Param('promptId') promptId: string) {
    return this.promptSvc.activatePrompt(promptId, 'API_USER');
  }

  @Post('prompts/:promptId/update')
  @ApiOperation({ summary: 'Atualizar conteúdo de prompt (volta para PENDING_APPROVAL)' })
  updatePrompt(
    @Param('promptId') promptId: string,
    @Body('newContent') newContent: string,
    @Body('newVersion') newVersion: string,
  ) {
    return this.promptSvc.updatePrompt(promptId, newContent, newVersion, 'API_USER');
  }

  @Get('prompts')
  @ApiOperation({ summary: 'Listar prompts do catálogo governado' })
  @ApiQuery({ name: 'status', required: false, enum: PromptStatus })
  listPrompts(@Query('status') status?: PromptStatus) {
    return this.promptSvc.listPrompts(status);
  }

  // ── AI RISK MANAGEMENT ────────────────────────────────────────────────────

  @Post('risks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar risco de IA com plano de mitigação' })
  registerRisk(@Body() dto: RegisterAIRiskDto) {
    return this.riskSvc.registerRisk(dto, 'API_USER');
  }

  @Post('risks/:riskId/mitigate')
  @ApiOperation({ summary: 'Marcar risco de IA como mitigado' })
  mitigateRisk(@Param('riskId') riskId: string, @Body('mitigatedBy') mitigatedBy: string) {
    return this.riskSvc.mitigateRisk(riskId, mitigatedBy ?? 'CAIO');
  }

  @Get('risks')
  @ApiOperation({ summary: 'Listar riscos de IA por categoria' })
  @ApiQuery({ name: 'category', required: false, enum: AIRiskCategory })
  listRisks(@Query('category') category?: AIRiskCategory) {
    return this.riskSvc.listRisks(category);
  }

  // ── EXPLAINABLE AI (XAI) ──────────────────────────────────────────────────

  @Post('xai/explain')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Gerar explicação detalhada de decisão automatizada (XAI)' })
  explainDecision(@Body() dto: ExplainDecisionDto) {
    return this.xaiSvc.explainDecision(dto, 'API_USER');
  }

  @Get('xai/explanations')
  @ApiOperation({ summary: 'Listar explicações de IA geradas' })
  listExplanations() {
    return this.xaiSvc.listExplanations();
  }

  @Get('xai/explanations/:explanationId')
  @ApiOperation({ summary: 'Obter explicação detalhada pelo ID' })
  getExplanation(@Param('explanationId') explanationId: string) {
    const e = this.xaiSvc.getExplanation(explanationId);
    if (!e) return { error: 'Explicação não encontrada', explanationId };
    return e;
  }

  // ── AI EVALUATION ─────────────────────────────────────────────────────────

  @Post('evaluation/evaluate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Avaliar desempenho contínuo de modelo (accuracy, drift, hallucinations)' })
  evaluateModel(@Body() dto: EvaluateModelDto) {
    return this.evalSvc.evaluateModel(dto);
  }

  @Get('evaluation/reports')
  @ApiOperation({ summary: 'Listar relatórios de avaliação de modelos' })
  @ApiQuery({ name: 'assetId', required: false })
  listEvaluations(@Query('assetId') assetId?: string) {
    return this.evalSvc.listEvaluations(assetId);
  }

  // ── AI GOVERNANCE POLICIES ────────────────────────────────────────────────

  @Post('governance/policies')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar política de governança para ativo de IA' })
  createGovernancePolicy(
    @Body('assetId') assetId: string,
    @Body('policyName') policyName: string,
    @Body('requiresHumanReview') requiresHumanReview: boolean,
    @Body('maxAutonomyLevel') maxAutonomyLevel: any,
    @Body('dataAccessScope') dataAccessScope: string[],
    @Body('retentionDays') retentionDays: number,
    @Body('approvedBy') approvedBy: string,
  ) {
    return this.govSvc.createPolicy(
      assetId, policyName ?? 'Default AI Policy', requiresHumanReview ?? true,
      maxAutonomyLevel ?? 'SUPERVISED', dataAccessScope ?? [], retentionDays ?? 365,
      approvedBy ?? 'CGO',
    );
  }

  @Post('governance/policies/:policyId/revoke')
  @ApiOperation({ summary: 'Revogar política de governança de IA' })
  revokePolicy(@Param('policyId') policyId: string, @Body('revokedBy') revokedBy: string, @Body('reason') reason: string) {
    return this.govSvc.revokePolicy(policyId, revokedBy ?? 'CGO', reason ?? 'Revogada');
  }

  @Get('governance/policies')
  @ApiOperation({ summary: 'Listar políticas de governança de IA' })
  listGovernancePolicies() {
    return this.govSvc.listPolicies();
  }

  // ── COGNITIVE AGENT GOVERNANCE ────────────────────────────────────────────

  @Post('agents/governance/evaluate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Avaliar conformidade de agente cognitivo' })
  evaluateAgentCompliance(
    @Body('agentId') agentId: string,
    @Body('agentName') agentName: string,
    @Body('modelUsed') modelUsed: string,
    @Body('permissionsGranted') permissionsGranted: string[],
    @Body('memoryEnabled') memoryEnabled: boolean,
  ) {
    return this.cogAgentSvc.evaluateAgentCompliance(
      agentId, agentName ?? 'Agent', modelUsed ?? 'Gemini', permissionsGranted ?? [],
      memoryEnabled ?? false, 'API_USER',
    );
  }

  @Get('agents/governance/records')
  @ApiOperation({ summary: 'Listar registros de governança de agentes cognitivos' })
  listAgentGovernanceRecords() {
    return this.cogAgentSvc.listRecords();
  }

  // ── AUDIT ─────────────────────────────────────────────────────────────────

  @Get('audit')
  @ApiOperation({ summary: 'Trilha imutável de auditoria EAIGP com assinatura SHA-256' })
  @ApiQuery({ name: 'subject', required: false })
  getAuditTrail(@Query('subject') subject?: string) {
    return this.auditSvc.getAuditTrail(subject);
  }

  @Get('audit/count')
  @ApiOperation({ summary: 'Total de entradas na trilha de auditoria EAIGP' })
  getAuditCount() {
    return { count: this.auditSvc.getAuditCount() };
  }
}

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard, AuraJwtPayload } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles, AuraRole } from '../../../shared/decorators/roles.decorator';
import { BaseResponseDto } from '../../../shared/dto/base-response.dto';
import { WorkflowEngineService } from '../services/workflow-engine.service';
import { RulesEngineService } from '../services/rules-engine.service';
import { TaskManagementService } from '../services/task-management.service';
import {
  CreateWorkflowDto,
  StartWorkflowDto,
  CreateRuleDto,
  CreateTaskDto,
  CompleteTaskDto,
  EvaluateDecisionDto,
} from '../dto/workflow.dto';

/**
 * WorkflowController — APIs REST da Plataforma de Workflow, Regras e Automação (AEWRP)
 *
 * Expõe endpoints REST para:
 * - Definição e execução de workflows BPMN 2.0
 * - Gestão do Rules Engine (criação/avaliação de regras)
 * - Gerenciamento de tarefas e monitoramento de SLA
 *
 * Referências: P139 AEWRP Etapa 11, OpenAPI 3.1
 */
@ApiTags('Workflow, Rules Engine & Process Automation')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@Controller({ path: 'workflow', version: '1' })
export class WorkflowController {
  constructor(
    private readonly workflowEngine: WorkflowEngineService,
    private readonly rulesEngine: RulesEngineService,
    private readonly taskService: TaskManagementService,
  ) {}

  // ── Workflows ──────────────────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN)
  @Post('definitions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Definir novo Workflow BPMN 2.0 [SUPER_ADMIN]' })
  async defineWorkflow(
    @Body() dto: CreateWorkflowDto,
    @Req() req: FastifyRequest & { user: AuraJwtPayload },
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const def = this.workflowEngine.define(dto, req.user.sub);
    return BaseResponseDto.created(def, requestId, `Workflow "${dto.name}" v${dto.version} definido.`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('definitions')
  @ApiOperation({ summary: 'Listar Workflows BPMN 2.0 disponíveis' })
  async listDefinitions(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.workflowEngine.listDefinitions(), requestId);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Post('instances/start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Iniciar instância de Workflow BPMN 2.0' })
  async startWorkflow(
    @Body() dto: StartWorkflowDto,
    @Req() req: FastifyRequest & { user: AuraJwtPayload },
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const instance = await this.workflowEngine.start(dto, req.user.sub, tenantId);
    return BaseResponseDto.created(instance, requestId, `Workflow "${instance.workflowName}" iniciado.`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('instances/running')
  @ApiOperation({ summary: 'Listar instâncias de Workflow em execução' })
  async getRunning(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.workflowEngine.getRunningInstances(), requestId);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Get('instances/:id')
  @ApiOperation({ summary: 'Obter detalhes de instância de Workflow' })
  async getInstance(@Param('id') instanceId: string, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.workflowEngine.getInstance(instanceId), requestId);
  }

  // ── Rules Engine ───────────────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN)
  @Post('rules')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar Regra de Negócio parametrizável [SUPER_ADMIN]' })
  async createRule(
    @Body() dto: CreateRuleDto,
    @Req() req: FastifyRequest & { user: AuraJwtPayload },
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const rule = await this.rulesEngine.createRule(dto, req.user.sub);
    return BaseResponseDto.created(rule, requestId, `Regra "${dto.name}" criada e ativa.`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('rules')
  @ApiOperation({ summary: 'Listar Regras de Negócio (ordenadas por prioridade)' })
  async listRules(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.rulesEngine.listRules(), requestId);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Post('decisions/evaluate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Avaliar contexto contra todas as regras ativas (Decision Engine)' })
  async evaluate(@Body() dto: EvaluateDecisionDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const result = await this.rulesEngine.evaluate(dto.context);
    return BaseResponseDto.ok(result, requestId, undefined, `${result.matchedRules.length} regra(s) corresponderam ao contexto.`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('decisions/audit')
  @ApiOperation({ summary: 'Log de Auditoria de Decisões do Motor de Regras' })
  async getDecisionAudit(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.rulesEngine.getAuditLog(), requestId);
  }

  // ── Task Management ────────────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Post('tasks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar Tarefa Institucional com SLA' })
  async createTask(
    @Body() dto: CreateTaskDto,
    @Req() req: FastifyRequest & { user: AuraJwtPayload },
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const task = await this.taskService.create(dto, req.user.sub, tenantId);
    return BaseResponseDto.created(task, requestId, `Tarefa "${dto.title}" criada.`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Post('tasks/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Concluir Tarefa' })
  async completeTask(
    @Body() dto: CompleteTaskDto,
    @Req() req: FastifyRequest & { user: AuraJwtPayload },
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const task = await this.taskService.complete(dto, req.user.sub, tenantId);
    return BaseResponseDto.ok(task, requestId, undefined, `Tarefa "${task.title}" concluída.`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('tasks/overdue')
  @ApiOperation({ summary: 'Listar Tarefas com SLA Excedido' })
  async getOverdueTasks(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.taskService.listOverdue(), requestId);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Post('sla/check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executar Verificação de SLA de Tarefas (monitor manual)' })
  async checkSla(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const alerts = await this.taskService.checkSla(tenantId);
    return BaseResponseDto.ok(alerts, requestId, undefined, `${alerts.length} alerta(s) de SLA detectado(s).`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Get('tasks/assignee/:id')
  @ApiOperation({ summary: 'Listar Tarefas de um Responsável' })
  async getByAssignee(@Param('id') assigneeId: string, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.taskService.findByAssignee(assigneeId), requestId);
  }
}

import { Module } from '@nestjs/common';
import { WorkflowController } from './controllers/workflow.controller';
import { WorkflowEngineService } from './services/workflow-engine.service';
import { RulesEngineService } from './services/rules-engine.service';
import { TaskManagementService } from './services/task-management.service';
import { EventBusModule } from '../../events/event-bus.module';

/**
 * WorkflowModule — Plataforma de Workflow, Regras e Automação de Processos (AEWRP)
 *
 * Integra:
 * - WorkflowEngineService (BPMN 2.0: processos sequenciais, paralelos, condicionais, subprocessos)
 * - RulesEngineService (regras configuráveis pelo SUPER_ADMIN, sem alteração de código)
 * - TaskManagementService (tarefas, SLA, delegação, escalonamento)
 *
 * Exporta todos os serviços para consumo por outros módulos do ecossistema Aura.
 *
 * Referências: P110 AEWBPM, P112 AEDIP, P139 AEWRP
 */
@Module({
  imports: [EventBusModule],
  controllers: [WorkflowController],
  providers: [
    WorkflowEngineService,
    RulesEngineService,
    TaskManagementService,
  ],
  exports: [
    WorkflowEngineService,
    RulesEngineService,
    TaskManagementService,
  ],
})
export class WorkflowModule {}

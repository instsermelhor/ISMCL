import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import {
  DispatchCognitiveTaskDto,
  ReasoningQueryDto,
  RecommendationFeedbackDto,
  ModelRegistrationDto,
  ModelLifecycleState,
  RecommendationCategory,
} from '../dto/cognitive-orchestration.dto';
import { AITaskRoutingService } from '../services/ai-task-routing.service';
import { AICollaborationService } from '../services/ai-collaboration.service';
import { InstitutionalReasoningEngine } from '../services/institutional-reasoning.service';
import { AutonomousRecommendationService } from '../services/autonomous-recommendation.service';
import { ModelRegistryLifecycleService } from '../services/model-registry-lifecycle.service';
import { AIPerformanceMonitoringService } from '../services/ai-performance-monitoring.service';
import { CognitiveMemoryService } from '../services/cognitive-memory.service';
import { CognitiveAuditService } from '../services/cognitive-audit.service';

@Controller('api/v1/cognitive')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CognitiveOrchestrationController {
  constructor(
    private readonly taskRouting: AITaskRoutingService,
    private readonly aiCollaboration: AICollaborationService,
    private readonly reasoningEngine: InstitutionalReasoningEngine,
    private readonly recommendationService: AutonomousRecommendationService,
    private readonly modelRegistry: ModelRegistryLifecycleService,
    private readonly performanceMonitoring: AIPerformanceMonitoringService,
    private readonly memoryService: CognitiveMemoryService,
    private readonly auditService: CognitiveAuditService,
  ) {}

  @Post('orchestration/dispatch')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CASE_MANAGER', 'HEALTH_PROFESSIONAL')
  @HttpCode(HttpStatus.OK)
  dispatchCognitiveTask(@Body() dto: DispatchCognitiveTaskDto) {
    const selectedAgents = this.taskRouting.selectOptimalAgents(dto.targetDomains, dto.priority);
    
    // Simulate agent analyses
    const simulatedMessages = selectedAgents.map((agent) => ({
      agentId: agent.agentId,
      domainRole: agent.domainRole,
      analysis: `Análise especializada concluída para o domínio ${agent.domainRole} no contexto: "${dto.taskContext.summary || 'Análise Multidisciplinar'}"`,
      confidence: 0.92 + Math.random() * 0.06,
      timestamp: new Date().toISOString(),
    }));

    const consensus = this.aiCollaboration.synthesizeConsensus(dto.taskId, simulatedMessages);

    // Release agents after task completion
    for (const agent of selectedAgents) {
      this.taskRouting.releaseAgentLoad(agent.agentId);
    }

    return {
      taskId: dto.taskId,
      priority: dto.priority,
      selectedAgents: selectedAgents.map((a) => ({ agentId: a.agentId, domainRole: a.domainRole })),
      consensus,
      dispatchedAt: new Date().toISOString(),
    };
  }

  @Post('reasoning/query')
  @Roles('SUPER_ADMIN', 'ADMIN', 'HEALTH_PROFESSIONAL', 'LEGAL_AUDITOR')
  @HttpCode(HttpStatus.OK)
  queryInstitutionalReasoning(@Body() dto: ReasoningQueryDto) {
    return this.reasoningEngine.executeReasoning(dto);
  }

  @Post('recommendations/feedback')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CASE_MANAGER', 'CLINICAL_DIRECTOR')
  @HttpCode(HttpStatus.OK)
  processRecommendationFeedback(@Body() dto: RecommendationFeedbackDto) {
    return this.recommendationService.processHumanFeedback(dto);
  }

  @Get('recommendations')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CASE_MANAGER', 'CLINICAL_DIRECTOR')
  listRecommendations(@Query('category') category?: RecommendationCategory) {
    return this.recommendationService.listRecommendations(category);
  }

  @Post('models/register')
  @Roles('SUPER_ADMIN', 'CISO')
  @HttpCode(HttpStatus.CREATED)
  registerModel(@Body() dto: ModelRegistrationDto) {
    return this.modelRegistry.registerModel(dto);
  }

  @Patch('models/:modelId/state')
  @Roles('SUPER_ADMIN', 'CISO')
  transitionModelState(
    @Param('modelId') modelId: string,
    @Body('newState') newState: ModelLifecycleState,
    @Body('humanApproverId') humanApproverId?: string,
  ) {
    return this.modelRegistry.transitionState(modelId, newState, humanApproverId);
  }

  @Get('models')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CISO')
  listModels() {
    return this.modelRegistry.listModels();
  }

  @Get('performance')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CISO', 'DATA_OFFICER')
  getPerformanceMetrics() {
    return this.performanceMonitoring.getAllMetrics();
  }

  @Get('memory')
  @Roles('SUPER_ADMIN', 'ADMIN', 'DATA_OFFICER')
  searchCognitiveMemory(@Query('q') queryKey = '') {
    return this.memoryService.searchMemory(queryKey);
  }

  @Get('audits')
  @Roles('SUPER_ADMIN', 'CISO', 'AUDITOR')
  getAuditLogs() {
    return this.auditService.getAuditLogs();
  }
}

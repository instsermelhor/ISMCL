import { AiGatewayService } from './ai-gateway.service';
import { RagKnowledgeService } from './rag-knowledge.service';
import { PromptGovernanceService } from './prompt-governance.service';
import { AiAssistantService } from './ai-assistant.service';
import { EventBusService } from '../../../events/event-bus.service';
import {
  LLMProvider,
  AssistantRole,
  KnowledgeCategory,
  AIRiskClassification,
} from '../dto/ai.dto';

describe('AiGatewayService', () => {
  let service: AiGatewayService;

  beforeEach(() => {
    service = new AiGatewayService();
  });

  it('should generate completion using Gemini provider', async () => {
    const response = await service.generateCompletion({
      provider: LLMProvider.GEMINI,
      userPrompt: 'Como funciona o acolhimento na Plataforma Aura?',
    });

    expect(response.responseId).toBeDefined();
    expect(response.provider).toBe(LLMProvider.GEMINI);
    expect(response.content).toContain('Instituto Ser Melhor');
    expect(response.latencyMs).toBeGreaterThan(0);
  });
});

describe('RagKnowledgeService', () => {
  let service: RagKnowledgeService;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    eventBusMock = { publish: jest.fn().mockResolvedValue({} as any) };
    service = new RagKnowledgeService(eventBusMock as EventBusService);
  });

  it('should retrieve relevant POP documents with source citations', async () => {
    const result = await service.queryRag({ query: 'triagem de crise e acolhimento' });

    expect(result.query).toBe('triagem de crise e acolhimento');
    expect(result.retrievedDocuments.length).toBeGreaterThan(0);
    expect(result.sourcesUsed.length).toBeGreaterThan(0);
    expect(result.sourcesUsed[0]).toContain('POP-001');
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.ai.knowledge.retrieved.v1',
      expect.objectContaining({ query: expect.any(String) }),
      'default',
      expect.anything(),
    );
  });
});

describe('PromptGovernanceService', () => {
  let service: PromptGovernanceService;

  beforeEach(() => {
    service = new PromptGovernanceService();
  });

  it('should have approved system prompts pre-loaded for all 10 assistant roles', () => {
    const prompts = service.listAll();
    expect(prompts.length).toBeGreaterThanOrEqual(10);
    expect(prompts.every((p) => p.status === 'APPROVED')).toBe(true);
  });
});

describe('AiAssistantService', () => {
  let service: AiAssistantService;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    eventBusMock = { publish: jest.fn().mockResolvedValue({} as any) };
    const gateway = new AiGatewayService();
    const rag = new RagKnowledgeService(eventBusMock as EventBusService);
    const promptGov = new PromptGovernanceService();

    service = new AiAssistantService(gateway, rag, promptGov, eventBusMock as EventBusService);
  });

  it('should invoke Psychologist Assistant and enforce Responsible AI human review warning', async () => {
    const response = await service.invoke(
      {
        assistantRole: AssistantRole.PSYCHOLOGIST,
        userPrompt: 'Quais técnicas de intervenção em crise ansiosa são recomendadas pelo POP?',
      },
      'prof-001',
    );

    expect(response.invocationId).toBeDefined();
    expect(response.assistantRole).toBe(AssistantRole.PSYCHOLOGIST);
    expect(response.riskClassification).toBe(AIRiskClassification.HIGH);
    expect(response.requiresHumanReview).toBe(true);
    expect(response.responseContent).toContain('validação prévia do profissional responsável');
    expect(response.sourcesUsed.length).toBeGreaterThan(0);
  });
});

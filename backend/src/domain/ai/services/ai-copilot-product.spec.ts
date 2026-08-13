import { Test, TestingModule } from '@nestjs/testing';
import { AiAssistantService } from './ai-assistant.service';
import { RagKnowledgeService } from './rag-knowledge.service';
import { PromptGovernanceService } from './prompt-governance.service';
import { AiGatewayService } from './ai-gateway.service';
import { EventBusService } from '../../../events/event-bus.service';
import { AssistantRole } from '../dto/ai.dto';

describe('Advanced Product & Innovation Test Suite (PROMPT 200 — FASE E)', () => {
  let assistantService: AiAssistantService;
  let ragService: RagKnowledgeService;
  let eventBus: any;

  beforeEach(async () => {
    eventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiAssistantService,
        RagKnowledgeService,
        PromptGovernanceService,
        {
          provide: AiGatewayService,
          useValue: {
            generateCompletion: jest.fn().mockResolvedValue({
              content: 'Relatório estruturado: Paciente apresenta evolução positiva.',
              provider: 'google-vertex-gemini',
              modelName: 'gemini-1.5-pro',
              tokensPrompt: 45,
              tokensCompletion: 80,
              latencyMs: 250,
            }),
          },
        },
        { provide: EventBusService, useValue: eventBus },
      ],
    }).compile();

    assistantService = module.get<AiAssistantService>(AiAssistantService);
    ragService = module.get<RagKnowledgeService>(RagKnowledgeService);
  });

  describe('Pilar 1: Copiloto Clínico IA RAG com Sanitização PII e IA Responsável', () => {
    it('deve invocar assistente de IA, sanitizar dados sensíveis e adicionar aviso de IA responsável', async () => {
      const response = await assistantService.invoke(
        {
          assistantRole: AssistantRole.PSYCHOLOGIST,
          userPrompt: 'Gerar nota SOAP para o paciente João da Silva CPF 123.456.789-00',
          enableRag: true,
        },
        'user-prof-1',
        'tenant-aura',
      );

      expect(response).toBeDefined();
      expect(response.assistantRole).toBe(AssistantRole.PSYCHOLOGIST);
      expect(response.requiresHumanReview).toBe(true);
      expect(response.responseContent).toContain('⚠️ *Aviso de IA Responsável');

      // Validação de publicação no barramento de eventos
      expect(eventBus.publish).toHaveBeenCalledWith(
        'aura.ai.assistant.invoked.v1',
        expect.objectContaining({
          assistantRole: AssistantRole.PSYCHOLOGIST,
          userId: 'user-prof-1',
        }),
        'tenant-aura',
        expect.any(Object),
      );
    });

    it('deve buscar artigos corporativos na base vetorial RAG com citação de fontes', async () => {
      const ragResults = await ragService.queryRag(
        {
          query: 'crise psicológica acolhimento',
          topK: 2,
        },
        'tenant-aura',
      );

      expect(ragResults).toBeDefined();
      expect(ragResults.retrievedDocuments.length).toBeGreaterThan(0);
      expect(ragResults.sourcesUsed.length).toBeGreaterThan(0);
      expect(ragResults.sourcesUsed[0]).toContain('POP-001');
    });
  });
});

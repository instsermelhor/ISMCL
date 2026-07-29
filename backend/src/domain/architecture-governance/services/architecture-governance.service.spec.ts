import { ArchitectureRepositoryService } from './architecture-repository.service';
import { DigitalTwinComplianceService } from './digital-twin-compliance.service';
import { EventBusService } from '../../../events/event-bus.service';
import {
  AdrStatus,
  ComplianceLevel,
  DebtCategory,
  DebtSeverity,
} from '../dto/architecture-governance.dto';

describe('ArchitectureRepositoryService', () => {
  let repositoryService: ArchitectureRepositoryService;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    eventBusMock = { publish: jest.fn().mockResolvedValue({} as any) };
    repositoryService = new ArchitectureRepositoryService(eventBusMock as EventBusService);
  });

  it('should have pre-seeded architecture inventory of core domains', () => {
    const inventory = repositoryService.listInventory();
    expect(inventory.length).toBeGreaterThanOrEqual(5);
    const ehr = inventory.find((i) => i.domainName.includes('Health Record'));
    expect(ehr).toBeDefined();
    expect(ehr?.apiEndpointsCount).toBeGreaterThan(0);
  });

  it('should create an ADR record with SHA-256 signature and publish CloudEvent', async () => {
    const adr = await repositoryService.createAdr({
      title: 'Adoção Obrigatória de CloudEvents v1.0.3 para Event Bus',
      context: 'Necessidade de padronização de metadados em mensageria.',
      decision: 'Todos os microsserviços devem emitir CloudEvents padronizados.',
      consequences: 'Interoperabilidade nativa e desacoplamento de barramento.',
    });

    expect(adr.adrCode).toMatch(/^ADR-\d{4}-\d{4,5}$/);
    expect(adr.status).toBe(AdrStatus.ACCEPTED);
    expect(adr.digitalSignature).toHaveLength(64); // SHA-256
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.architecture.adr.created.v1',
      expect.objectContaining({ adrCode: adr.adrCode }),
      'default',
      expect.anything(),
    );
  });

  it('should register technical debt item and classify severity', async () => {
    const debt = await repositoryService.registerTechnicalDebt({
      title: 'Refatoração de DTOs legados no módulo de Prontuário',
      category: DebtCategory.CODE,
      severity: DebtSeverity.MEDIUM,
      remediationHours: 16,
      affectedModule: 'EHRModule',
    });

    expect(debt.debtId).toBeDefined();
    expect(debt.remediationHours).toBe(16);
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.architecture.technical_debt.registered.v1',
      expect.objectContaining({ category: DebtCategory.CODE }),
      'default',
      expect.anything(),
    );
  });
});

describe('DigitalTwinComplianceService', () => {
  let repositoryService: ArchitectureRepositoryService;
  let complianceService: DigitalTwinComplianceService;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    eventBusMock = { publish: jest.fn().mockResolvedValue({} as any) };
    repositoryService = new ArchitectureRepositoryService(eventBusMock as EventBusService);
    complianceService = new DigitalTwinComplianceService(repositoryService, eventBusMock as EventBusService);
  });

  it('should generate Digital Twin state reflecting real repository metrics', async () => {
    const twin = await complianceService.getDigitalTwinState();
    expect(twin.systemTopologyHealth).toBe('OPTIMAL');
    expect(twin.totalDomainsCataloged).toBeGreaterThan(0);
    expect(twin.totalApiEndpoints).toBeGreaterThan(0);
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.architecture.digital_twin.synchronized.v1',
      expect.objectContaining({ systemTopologyHealth: 'OPTIMAL' }),
      'default',
      expect.anything(),
    );
  });

  it('should execute architecture compliance audit and report 100% adherence', async () => {
    const report = await complianceService.auditCompliance({
      moduleName: 'IntegrationModule',
      evaluationRules: 'Clean Architecture + DDD + SOLID + Zero Trust',
    });

    expect(report.complianceLevel).toBe(ComplianceLevel.FULL_COMPLIANCE);
    expect(report.scorePercentage).toBe(100);
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.architecture.compliance.validated.v1',
      expect.objectContaining({ scorePercentage: 100 }),
      'default',
      expect.anything(),
    );
  });
});

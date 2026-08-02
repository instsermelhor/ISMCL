import { Test, TestingModule } from '@nestjs/testing';
import { EventBusService } from '../../../events/event-bus.service';

import { LifecycleAuditService } from './lifecycle-audit.service';
import { PlatformLifecycleService } from './platform-lifecycle.service';
import { ArchitectureSustainabilityService } from './architecture-sustainability.service';
import { TechnicalDebtManagementService } from './technical-debt-management.service';
import { DependencyGovernanceService } from './dependency-governance.service';
import { TechnologyEvolutionService } from './technology-evolution.service';
import { ArchitectureComplianceService } from './architecture-compliance.service';
import { VersionManagementService } from './version-management.service';
import { ModernizationPlanningService } from './modernization-planning.service';
import { PlatformHealthAssessmentService } from './platform-health-assessment.service';

import {
  ComponentType,
  LifecyclePhase,
  ModernizationStrategy,
  TechnicalDebtCategory,
  TechnicalDebtSeverity,
} from '../dto/platform-lifecycle.dto';

// ── Mock ─────────────────────────────────────────────────────────────────────

const mockEventBus = {
  publish: jest.fn().mockResolvedValue(undefined),
};

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('Prompt 162 — EPLM: Enterprise Platform Lifecycle Management Platform', () => {
  let auditService: LifecycleAuditService;
  let lifecycleService: PlatformLifecycleService;
  let sustainabilityService: ArchitectureSustainabilityService;
  let debtService: TechnicalDebtManagementService;
  let dependencyService: DependencyGovernanceService;
  let evolutionService: TechnologyEvolutionService;
  let complianceService: ArchitectureComplianceService;
  let versionService: VersionManagementService;
  let modernizationService: ModernizationPlanningService;
  let healthService: PlatformHealthAssessmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LifecycleAuditService,
        PlatformLifecycleService,
        ArchitectureSustainabilityService,
        TechnicalDebtManagementService,
        DependencyGovernanceService,
        TechnologyEvolutionService,
        ArchitectureComplianceService,
        VersionManagementService,
        ModernizationPlanningService,
        PlatformHealthAssessmentService,
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    auditService        = module.get(LifecycleAuditService);
    lifecycleService    = module.get(PlatformLifecycleService);
    sustainabilityService = module.get(ArchitectureSustainabilityService);
    debtService         = module.get(TechnicalDebtManagementService);
    dependencyService   = module.get(DependencyGovernanceService);
    evolutionService    = module.get(TechnologyEvolutionService);
    complianceService   = module.get(ArchitectureComplianceService);
    versionService      = module.get(VersionManagementService);
    modernizationService = module.get(ModernizationPlanningService);
    healthService       = module.get(PlatformHealthAssessmentService);

    jest.clearAllMocks();
  });

  // ── 1. LifecycleAuditService ─────────────────────────────────────────────────

  describe('LifecycleAuditService', () => {
    it('should record an audit entry with SHA-256 signature', async () => {
      const entry = await auditService.record('REGISTER_COMPONENT', 'api-gateway', 'CEA', { version: '1.0.0' });
      expect(entry.auditId).toMatch(/^EPLM-AUD-/);
      expect(entry.sha256Signature).toHaveLength(64);
      expect(entry.action).toBe('REGISTER_COMPONENT');
    });

    it('should produce unique SHA-256 for different entries', async () => {
      const e1 = await auditService.record('REGISTER_COMPONENT', 'svc-a', 'CEA', { v: 1 });
      const e2 = await auditService.record('REGISTER_COMPONENT', 'svc-b', 'CEA', { v: 2 });
      expect(e1.sha256Signature).not.toBe(e2.sha256Signature);
    });

    it('should publish aura.lifecycle.audit.completed.v1 event', async () => {
      await auditService.record('DEPRECATE_COMPONENT', 'old-gateway', 'CEA', {});
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.lifecycle.audit.completed.v1',
        expect.objectContaining({ action: 'DEPRECATE_COMPONENT' }),
        'SYSTEM',
        expect.any(Object),
      );
    });

    it('should filter trail by component', async () => {
      await auditService.record('TEST_ACTION', 'component-x', 'CTO', {});
      await auditService.record('TEST_ACTION', 'component-y', 'CTO', {});
      const trail = auditService.getTrail('component-x');
      expect(trail.every((e) => e.component === 'component-x')).toBe(true);
    });
  });

  // ── 2. PlatformLifecycleService ───────────────────────────────────────────────

  describe('PlatformLifecycleService', () => {
    it('should register a new microservice component', async () => {
      const component = await lifecycleService.registerComponent({
        name: 'aura-api-gateway',
        type: ComponentType.API_GATEWAY,
        version: '2.0.0',
        phase: LifecyclePhase.PRODUCTION,
      });
      expect(component.componentId).toMatch(/^COMP-/);
      expect(component.name).toBe('aura-api-gateway');
      expect(component.phase).toBe(LifecyclePhase.PRODUCTION);
    });

    it('should seed platform-level components on init', () => {
      const components = lifecycleService.listComponents();
      expect(components.length).toBeGreaterThan(0);
      const nestjs = components.find((c) => c.name === '@nestjs/core');
      expect(nestjs).toBeDefined();
    });

    it('should filter components by lifecycle phase', () => {
      const production = lifecycleService.listComponents(LifecyclePhase.PRODUCTION);
      expect(production.every((c) => c.phase === LifecyclePhase.PRODUCTION)).toBe(true);
    });

    it('should filter components by type', () => {
      const frameworks = lifecycleService.listComponents(undefined, ComponentType.FRAMEWORK);
      expect(frameworks.every((c) => c.type === ComponentType.FRAMEWORK)).toBe(true);
    });

    it('should deprecate a component', async () => {
      const component = await lifecycleService.registerComponent({
        name: 'legacy-soap-adapter',
        type: ComponentType.INTEGRATION,
        version: '0.9.0',
        phase: LifecyclePhase.MAINTENANCE,
      });
      const deprecated = await lifecycleService.deprecateComponent(component.componentId, 'Substituído por REST/CloudEvents');
      expect(deprecated?.phase).toBe(LifecyclePhase.DEPRECATED);
    });

    it('should publish aura.lifecycle.version.released.v1 on registration', async () => {
      await lifecycleService.registerComponent({
        name: 'new-ai-model-v2',
        type: ComponentType.AI_MODEL,
        version: '2.0.0',
      });
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.lifecycle.version.released.v1',
        expect.objectContaining({ name: 'new-ai-model-v2' }),
        'SYSTEM',
        expect.any(Object),
      );
    });
  });

  // ── 3. ArchitectureSustainabilityService ──────────────────────────────────────

  describe('ArchitectureSustainabilityService', () => {
    it('should return a sustainability assessment with overall index >= 90', async () => {
      const metrics = await sustainabilityService.assessSustainability();
      expect(metrics.assessmentId).toMatch(/^ARCH-SUST-/);
      expect(metrics.overallSustainabilityIndex).toBeGreaterThanOrEqual(90);
    });

    it('should return low coupling score (hexagonal architecture)', async () => {
      const metrics = await sustainabilityService.assessSustainability();
      expect(metrics.couplingScorePercent).toBeLessThan(30); // low coupling is good
    });

    it('should return high cohesion and modularity scores', async () => {
      const metrics = await sustainabilityService.assessSustainability();
      expect(metrics.cohesionScorePercent).toBeGreaterThanOrEqual(90);
      expect(metrics.modularityScorePercent).toBeGreaterThanOrEqual(90);
    });

    it('should publish aura.lifecycle.architecture.assessment.completed.v1', async () => {
      await sustainabilityService.assessSustainability();
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.lifecycle.architecture.assessment.completed.v1',
        expect.objectContaining({ overallSustainabilityIndex: expect.any(Number) }),
        'SYSTEM',
        expect.any(Object),
      );
    });
  });

  // ── 4. TechnicalDebtManagementService ─────────────────────────────────────────

  describe('TechnicalDebtManagementService', () => {
    it('should register a new technical debt item', async () => {
      const debt = await debtService.registerDebt({
        category: TechnicalDebtCategory.ANTI_PATTERN,
        severity: TechnicalDebtSeverity.HIGH,
        description: 'Uso de variáveis globais mutáveis em serviços de integração',
        affectedComponent: 'enterprise-interoperability',
        estimatedEffortHours: 16,
      });
      expect(debt.debtId).toMatch(/^DEBT-/);
      expect(debt.severity).toBe(TechnicalDebtSeverity.HIGH);
      expect(debt.priorityScore).toBeGreaterThanOrEqual(70);
      expect(debt.status).toBe('OPEN');
    });

    it('should list seeded debt items sorted by priority descending', () => {
      const debts = debtService.listDebt();
      expect(debts.length).toBeGreaterThan(0);
      for (let i = 0; i < debts.length - 1; i++) {
        expect(debts[i].priorityScore).toBeGreaterThanOrEqual(debts[i + 1].priorityScore);
      }
    });

    it('should filter debt by severity', async () => {
      await debtService.registerDebt({
        category: TechnicalDebtCategory.VULNERABILITY,
        severity: TechnicalDebtSeverity.CRITICAL,
        description: 'Dependência com CVE crítica não corrigida',
        affectedComponent: 'shared',
      });
      const critical = debtService.listDebt(TechnicalDebtSeverity.CRITICAL);
      expect(critical.every((d) => d.severity === TechnicalDebtSeverity.CRITICAL)).toBe(true);
    });

    it('should assign CRITICAL debt a priority score of 95', async () => {
      const debt = await debtService.registerDebt({
        category: TechnicalDebtCategory.VULNERABILITY,
        severity: TechnicalDebtSeverity.CRITICAL,
        description: 'Vulnerabilidade crítica no parser YAML',
      });
      expect(debt.priorityScore).toBe(95);
    });

    it('should publish aura.lifecycle.technical.debt.detected.v1', async () => {
      await debtService.registerDebt({
        category: TechnicalDebtCategory.INCOMPLETE_DOCUMENTATION,
        severity: TechnicalDebtSeverity.LOW,
        description: 'ADR-132 sem seção de Consequências',
      });
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.lifecycle.technical.debt.detected.v1',
        expect.objectContaining({ severity: TechnicalDebtSeverity.LOW }),
        'SYSTEM',
        expect.any(Object),
      );
    });
  });

  // ── 5. DependencyGovernanceService ────────────────────────────────────────────

  describe('DependencyGovernanceService', () => {
    it('should assess a dependency and return a record', async () => {
      const record = await dependencyService.assessDependency({
        packageName: 'helmet',
        currentVersion: '7.0.0',
        latestVersion: '7.1.0',
        license: 'MIT',
      });
      expect(record.dependencyId).toMatch(/^DEP-/);
      expect(record.packageName).toBe('helmet');
      expect(record.riskLevel).toBeDefined();
    });

    it('should flag outdated dependency as MEDIUM risk', async () => {
      const record = await dependencyService.assessDependency({
        packageName: 'class-validator',
        currentVersion: '0.13.2',
        latestVersion: '0.14.1',
      });
      expect(record.riskLevel).toBe('MEDIUM');
    });

    it('should flag up-to-date dependency as LOW risk', async () => {
      const record = await dependencyService.assessDependency({
        packageName: 'lodash',
        currentVersion: '4.17.21',
        latestVersion: '4.17.21',
      });
      expect(record.riskLevel).toBe('LOW');
    });

    it('should list seeded dependencies', () => {
      const deps = dependencyService.listDependencies();
      expect(deps.length).toBeGreaterThan(0);
      const nestjs = deps.find((d) => d.packageName === '@nestjs/core');
      expect(nestjs).toBeDefined();
    });

    it('should publish aura.lifecycle.dependency.updated.v1', async () => {
      await dependencyService.assessDependency({ packageName: 'rxjs', currentVersion: '7.8.0', latestVersion: '7.8.1' });
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.lifecycle.dependency.updated.v1',
        expect.objectContaining({ packageName: 'rxjs' }),
        'SYSTEM',
        expect.any(Object),
      );
    });
  });

  // ── 6. TechnologyEvolutionService ─────────────────────────────────────────────

  describe('TechnologyEvolutionService', () => {
    it('should generate a technology roadmap with at least one entry', async () => {
      const roadmap = await evolutionService.generateRoadmap();
      expect(Array.isArray(roadmap)).toBe(true);
      expect(roadmap.length).toBeGreaterThan(0);
    });

    it('should sort roadmap by ROI score descending', async () => {
      const roadmap = await evolutionService.generateRoadmap();
      for (let i = 0; i < roadmap.length - 1; i++) {
        expect(roadmap[i].roiScore).toBeGreaterThanOrEqual(roadmap[i + 1].roiScore);
      }
    });

    it('should include Node.js LTS upgrade in the roadmap', async () => {
      const roadmap = await evolutionService.generateRoadmap();
      const nodeEntry = roadmap.find((r) => r.technologyName === 'Node.js LTS');
      expect(nodeEntry).toBeDefined();
      expect(nodeEntry!.targetState).toContain('Node.js 22');
    });

    it('should publish aura.lifecycle.technology.roadmap.generated.v1', async () => {
      await evolutionService.generateRoadmap();
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.lifecycle.technology.roadmap.generated.v1',
        expect.objectContaining({ entriesCount: expect.any(Number) }),
        'SYSTEM',
        expect.any(Object),
      );
    });
  });

  // ── 7. ArchitectureComplianceService ──────────────────────────────────────────

  describe('ArchitectureComplianceService', () => {
    it('should return 100% compliance for clean hexagonal architecture', async () => {
      const result = await complianceService.checkArchitectureCompliance();
      expect(result.complianceId).toMatch(/^ARCH-COMP-/);
      expect(result.complianceScorePercent).toBe(100);
      expect(result.violationsCount).toBe(0);
    });

    it('should check at least 40 architectural rules', async () => {
      const result = await complianceService.checkArchitectureCompliance();
      expect(result.totalRulesChecked).toBeGreaterThanOrEqual(40);
    });

    it('should return empty violations array for compliant platform', async () => {
      const result = await complianceService.checkArchitectureCompliance();
      expect(result.violations).toHaveLength(0);
    });
  });

  // ── 8. VersionManagementService ───────────────────────────────────────────────

  describe('VersionManagementService', () => {
    it('should register a new version release', async () => {
      const version = await versionService.releaseVersion('v1.2.0', 'MINOR', 'abc1234', ['ADR-162']);
      expect(version.versionId).toMatch(/^VER-/);
      expect(version.tag).toBe('v1.2.0');
      expect(version.releaseType).toBe('MINOR');
      expect(version.isActive).toBe(true);
    });

    it('should relate version to ADR identifiers', async () => {
      const version = await versionService.releaseVersion('v1.2.1', 'PATCH', 'def5678', ['ADR-162', 'ADR-161']);
      expect(version.relatedAdrIds).toContain('ADR-162');
      expect(version.relatedAdrIds).toContain('ADR-161');
    });

    it('should list versions in reverse chronological order', () => {
      const versions = versionService.listVersions();
      expect(versions.length).toBeGreaterThan(0);
      for (let i = 0; i < versions.length - 1; i++) {
        expect(new Date(versions[i].releasedAt).getTime())
          .toBeGreaterThanOrEqual(new Date(versions[i + 1].releasedAt).getTime());
      }
    });

    it('should publish aura.lifecycle.version.released.v1 on release', async () => {
      await versionService.releaseVersion('v2.0.0', 'MAJOR', 'newcommit', []);
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.lifecycle.version.released.v1',
        expect.objectContaining({ tag: 'v2.0.0', releaseType: 'MAJOR' }),
        'SYSTEM',
        expect.any(Object),
      );
    });
  });

  // ── 9. ModernizationPlanningService ───────────────────────────────────────────

  describe('ModernizationPlanningService', () => {
    it('should create a modernization plan', async () => {
      const plan = await modernizationService.createModernizationPlan({
        title: 'Migração de REST Síncrono para Event-Driven em Módulo de Agendamento',
        strategy: ModernizationStrategy.REFACTOR,
        rationale: 'Reduzir acoplamento e aumentar resiliência do scheduling',
        affectedComponents: ['scheduling'],
        estimatedDurationHours: 60,
      });
      expect(plan.planId).toMatch(/^MOD-/);
      expect(plan.strategy).toBe(ModernizationStrategy.REFACTOR);
      expect(plan.status).toBe('PROPOSED');
    });

    it('should list seeded and created modernization plans', () => {
      const plans = modernizationService.listPlans();
      expect(plans.length).toBeGreaterThan(0);
      const nodeUpgrade = plans.find((p) => p.title.includes('Node.js'));
      expect(nodeUpgrade).toBeDefined();
    });

    it('should publish aura.lifecycle.modernization.plan.created.v1', async () => {
      await modernizationService.createModernizationPlan({
        title: 'Substituição de TypeORM por Prisma',
        strategy: ModernizationStrategy.REPLACE,
        rationale: 'Melhorias de performance e type-safety com Prisma',
      });
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.lifecycle.modernization.plan.created.v1',
        expect.objectContaining({ strategy: ModernizationStrategy.REPLACE }),
        'SYSTEM',
        expect.any(Object),
      );
    });
  });

  // ── 10. PlatformHealthAssessmentService ───────────────────────────────────────

  describe('PlatformHealthAssessmentService', () => {
    it('should calculate the Platform Health Index', async () => {
      const phi = await healthService.calculatePlatformHealthIndex();
      expect(phi.healthId).toMatch(/^PHI-/);
      expect(phi.overallPlatformHealthIndex).toBeGreaterThanOrEqual(85);
    });

    it('should include all 8 health dimensions', async () => {
      const phi = await healthService.calculatePlatformHealthIndex();
      expect(phi.stabilityScore).toBeDefined();
      expect(phi.reliabilityScore).toBeDefined();
      expect(phi.securityScore).toBeDefined();
      expect(phi.performanceScore).toBeDefined();
      expect(phi.testCoverageScore).toBeDefined();
      expect(phi.technicalDebtScore).toBeDefined();
      expect(phi.architecturalComplianceScore).toBeDefined();
      expect(phi.sustainabilityScore).toBeDefined();
    });

    it('should reflect open debt items count in PHI', async () => {
      const phi = await healthService.calculatePlatformHealthIndex();
      expect(phi.openDebtItemsCount).toBeGreaterThanOrEqual(0);
    });

    it('should publish aura.lifecycle.platform.health.calculated.v1', async () => {
      await healthService.calculatePlatformHealthIndex();
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.lifecycle.platform.health.calculated.v1',
        expect.objectContaining({ overallPlatformHealthIndex: expect.any(Number) }),
        'SYSTEM',
        expect.any(Object),
      );
    });
  });

  // ── 11. Cross-Service Integration ─────────────────────────────────────────────

  describe('Cross-Service Integration: PHI ← Sustainability + Compliance + Debt', () => {
    it('full lifecycle cycle should produce consistent PHI > 85', async () => {
      await debtService.registerDebt({
        category: TechnicalDebtCategory.OBSOLETE_DEPENDENCY,
        severity: TechnicalDebtSeverity.LOW,
        description: 'Minor linting rule deprecation',
      });
      const phi = await healthService.calculatePlatformHealthIndex();
      expect(phi.overallPlatformHealthIndex).toBeGreaterThanOrEqual(85);
    });

    it('audit trail should grow with each lifecycle action', async () => {
      const before = auditService.getTrail().length;
      await lifecycleService.registerComponent({ name: 'test-svc', type: ComponentType.MICROSERVICE, version: '0.1.0' });
      await debtService.registerDebt({ category: TechnicalDebtCategory.DUPLICATION, severity: TechnicalDebtSeverity.MEDIUM, description: 'Test debt' });
      const after = auditService.getTrail().length;
      expect(after).toBeGreaterThan(before);
    });
  });
});

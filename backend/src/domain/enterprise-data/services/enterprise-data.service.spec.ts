import { Test, TestingModule } from '@nestjs/testing';
import { EventBusService } from '../../../events/event-bus.service';

import { DataGovernanceAuditService } from './data-governance-audit.service';
import { EnterpriseDataGovernanceService } from './enterprise-data-governance.service';
import { MasterDataManagementService } from './master-data-management.service';
import { DataFabricService } from './data-fabric.service';
import { MetadataCatalogService } from './metadata-catalog.service';
import { DataLineageService } from './data-lineage.service';
import { DataQualityService } from './data-quality.service';
import { DataContractsService } from './data-contracts.service';
import { DataOpsService } from './dataops.service';
import { DataStewardshipService } from './data-stewardship.service';

import {
  DataDomain,
  MasterEntityCategory,
  DataSensitivity,
} from '../dto/enterprise-data.dto';

const mockEventBus = { publish: jest.fn().mockResolvedValue(undefined) };

describe('P172 EDGP — Enterprise Data Governance, Data Fabric & Master Data Platform', () => {
  let auditSvc: DataGovernanceAuditService;
  let govSvc: EnterpriseDataGovernanceService;
  let mdmSvc: MasterDataManagementService;
  let fabricSvc: DataFabricService;
  let metadataSvc: MetadataCatalogService;
  let lineageSvc: DataLineageService;
  let qualitySvc: DataQualityService;
  let contractsSvc: DataContractsService;
  let dataopsSvc: DataOpsService;
  let stewardSvc: DataStewardshipService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataGovernanceAuditService,
        EnterpriseDataGovernanceService,
        MasterDataManagementService,
        DataFabricService,
        MetadataCatalogService,
        DataLineageService,
        DataQualityService,
        DataContractsService,
        DataOpsService,
        DataStewardshipService,
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    auditSvc = module.get(DataGovernanceAuditService);
    govSvc = module.get(EnterpriseDataGovernanceService);
    mdmSvc = module.get(MasterDataManagementService);
    fabricSvc = module.get(DataFabricService);
    metadataSvc = module.get(MetadataCatalogService);
    lineageSvc = module.get(DataLineageService);
    qualitySvc = module.get(DataQualityService);
    contractsSvc = module.get(DataContractsService);
    dataopsSvc = module.get(DataOpsService);
    stewardSvc = module.get(DataStewardshipService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── DataGovernanceAuditService ────────────────────────────────────────────
  describe('DataGovernanceAuditService', () => {
    it('deve registrar auditoria de dados com assinatura SHA-256 válida', async () => {
      const entry = await auditSvc.recordAudit('MDM_TEST', 'GOLDEN-01', 'CDO', { test: true });
      expect(entry.auditId).toMatch(/^EDGP-AUD-/);
      expect(entry.sha256Signature).toHaveLength(64);
    });

    it('deve filtrar trilha por assunto', async () => {
      await auditSvc.recordAudit('ACT_A', 'subj-1', 'CDO');
      await auditSvc.recordAudit('ACT_B', 'subj-2', 'CDO');
      const trail = auditSvc.getAuditTrail('subj-1');
      expect(trail.every((t) => t.subject === 'subj-1')).toBe(true);
    });
  });

  // ── EnterpriseDataGovernanceService ──────────────────────────────────────
  describe('EnterpriseDataGovernanceService', () => {
    it('deve definir domínio corporativo de dados com Data Owner e Stewards', async () => {
      const def = await govSvc.defineDomain({
        domain: DataDomain.BENEFICIARIES,
        owner: 'Dra. Maria (Diretora Social)',
        steward: 'Steward Social',
        description: 'Dados de beneficiários',
        defaultSensitivity: DataSensitivity.RESTRICTED,
        retentionYears: 10,
      });
      expect(def.domain).toBe(DataDomain.BENEFICIARIES);
      expect(def.owner).toContain('Dra. Maria');
    });

    it('deve listar domínios configurados', () => {
      const domains = govSvc.listDomains();
      expect(domains.length).toBeGreaterThan(0);
    });
  });

  // ── MasterDataManagementService ──────────────────────────────────────────
  describe('MasterDataManagementService', () => {
    it('deve criar Golden Record e resolver identidade', async () => {
      const golden = await mdmSvc.createGoldenRecord({
        category: MasterEntityCategory.BENEFICIARY,
        primaryNaturalKey: '12345678900',
        goldenAttributes: { fullName: 'Maria Silva', cpf: '12345678900' },
      });
      expect(golden.goldenId).toMatch(/^GOLDEN-BENEFICIARY-/);

      const res = await mdmSvc.resolveIdentity({
        category: MasterEntityCategory.BENEFICIARY,
        candidateRecord: { cpf: '12345678900' },
      });
      expect(res.isMatchFound).toBe(true);
      expect(res.goldenId).toBe(golden.goldenId);
    });
  });

  // ── DataFabricService ─────────────────────────────────────────────────────
  describe('DataFabricService', () => {
    it('deve executar consulta unificada abstraindo repositórios físicos', async () => {
      const result = await fabricSvc.executeUnifiedQuery(DataDomain.BENEFICIARIES, { status: 'ACTIVE' }, 'CDO');
      expect(result.queryId).toMatch(/^FAB-QRY-/);
      expect(result.sourcesQueried.length).toBeGreaterThan(0);
      expect(result.dataSnippet.length).toBeGreaterThan(0);
    });
  });

  // ── MetadataCatalogService ────────────────────────────────────────────────
  describe('MetadataCatalogService', () => {
    it('deve cadastrar metadado e permitir pesquisa semântica', async () => {
      await metadataSvc.registerEntity(
        'beneficiary_medical_records',
        'TABLE',
        DataDomain.HEALTH_CARE,
        'Prontuários médicos dos beneficiários',
        DataSensitivity.RESTRICTED,
        'Diretor Clínico',
        ['prontuário', 'saúde'],
      );

      const search = metadataSvc.searchCatalog('prontuário');
      expect(search.length).toBeGreaterThan(0);
      expect(search[0].name).toBe('beneficiary_medical_records');
    });
  });

  // ── DataLineageService ────────────────────────────────────────────────────
  describe('DataLineageService', () => {
    it('deve registrar e recuperar linhagem de dados completa', async () => {
      const lineage = await lineageSvc.recordLineage(
        'BeneficiaryConsolidatedReport',
        'ERP_SOCIAL',
        [
          { sourceSystem: 'ERP_SOCIAL', targetSystem: 'DATA_FABRIC', transformationLogic: 'Deduplicação MDM' },
          { sourceSystem: 'DATA_FABRIC', targetSystem: 'ANALYTICS_DW', transformationLogic: 'Agregação mensal' },
        ],
        ['ExecutiveDashboard', 'SocialImpactReport'],
      );
      expect(lineage.lineageId).toMatch(/^LIN-/);
      expect(lineage.hops).toHaveLength(2);

      const retrieved = lineageSvc.getLineage('BeneficiaryConsolidatedReport');
      expect(retrieved?.originSystem).toBe('ERP_SOCIAL');
    });
  });

  // ── DataQualityService ────────────────────────────────────────────────────
  describe('DataQualityService', () => {
    it('deve avaliar a qualidade dos dados em 7 dimensões', async () => {
      const report = await qualitySvc.evaluateQuality(DataDomain.BENEFICIARIES, 'CDO');
      expect(report.reportId).toMatch(/^QUAL-/);
      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeLessThanOrEqual(100);
      expect(report.dimensionResults).toHaveLength(7);
    });
  });

  // ── DataContractsService ──────────────────────────────────────────────────
  describe('DataContractsService', () => {
    it('deve publicar contrato de dados e validar payload', async () => {
      const contract = await contractsSvc.publishContract({
        contractName: 'BeneficiaryEventContract',
        version: '1.0.0',
        domain: DataDomain.BENEFICIARIES,
        schemaDefinition: { required: ['beneficiaryId', 'action'] },
        producerService: 'SocialService',
      });
      expect(contract.contractId).toBe('CTR-BeneficiaryEventContract-1.0.0');

      const validPayload = contractsSvc.validatePayloadAgainstContract(contract.contractId, { beneficiaryId: 'B-01', action: 'CREATE' });
      expect(validPayload.isValid).toBe(true);

      const invalidPayload = contractsSvc.validatePayloadAgainstContract(contract.contractId, { action: 'CREATE' });
      expect(invalidPayload.isValid).toBe(false);
      expect(invalidPayload.errors.length).toBeGreaterThan(0);
    });
  });

  // ── DataOpsService ────────────────────────────────────────────────────────
  describe('DataOpsService', () => {
    it('deve executar pipeline DataOps e validar lote de dados', async () => {
      const contract = await contractsSvc.publishContract({
        contractName: 'DataOpsContract',
        version: '1.0.0',
        domain: DataDomain.FINANCIAL,
        schemaDefinition: { required: ['transactionId'] },
        producerService: 'FinanceService',
      });

      const run = await dataopsSvc.runPipeline('Pipeline_Financeira', DataDomain.FINANCIAL, contract.contractId, [
        { transactionId: 'TX-100' },
      ]);
      expect(run.status).toBe('SUCCESS');
    });
  });

  // ── DataStewardshipService ────────────────────────────────────────────────
  describe('DataStewardshipService', () => {
    it('deve registrar ação operacional de Data Steward com alteração no MDM', async () => {
      const golden = await mdmSvc.createGoldenRecord({
        category: MasterEntityCategory.BENEFICIARY,
        primaryNaturalKey: '99988877700',
        goldenAttributes: { fullName: 'Nome Errado' },
      });

      const log = await stewardSvc.applyStewardOverride({
        recordId: golden.goldenId,
        correctedAttributes: { fullName: 'Nome Correto Ajustado' },
        justification: 'Apresentação de documento oficial',
        stewardName: 'DataSteward-Ana',
      });

      expect(log.actionId).toMatch(/^STEWARD-ACT-/);
      const updatedGolden = mdmSvc.getGoldenRecord(golden.goldenId);
      expect(updatedGolden?.goldenAttributes.fullName).toBe('Nome Correto Ajustado');
    });
  });
});

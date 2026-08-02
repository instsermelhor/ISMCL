import {
  Controller,
  Get,
  Post,
  Put,
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

import { EnterpriseDataGovernanceService } from '../services/enterprise-data-governance.service';
import { MasterDataManagementService } from '../services/master-data-management.service';
import { DataFabricService } from '../services/data-fabric.service';
import { MetadataCatalogService } from '../services/metadata-catalog.service';
import { DataLineageService } from '../services/data-lineage.service';
import { DataQualityService } from '../services/data-quality.service';
import { DataContractsService } from '../services/data-contracts.service';
import { DataOpsService } from '../services/dataops.service';
import { DataStewardshipService } from '../services/data-stewardship.service';
import { DataGovernanceAuditService } from '../services/data-governance-audit.service';

import {
  DefineDataDomainDto,
  CreateGoldenRecordDto,
  ResolveIdentityDto,
  PublishDataContractDto,
  StewardOverrideDto,
  DataDomain,
  MasterEntityCategory,
  DataSensitivity,
} from '../dto/enterprise-data.dto';

/**
 * EnterpriseDataController — P172 EDGP (Fase XXII)
 *
 * REST API da Governança de Dados Corporativos, Data Fabric e Master Data (EDGP):
 * Domínios de dados, MDM (Golden Records), Data Fabric, Catálogo de Metadados,
 * Data Lineage, Qualidade de Dados, Contratos de Dados, DataOps, Data Stewardship e Auditoria.
 */
@ApiBearerAuth()
@ApiTags('EDGP — Enterprise Data Governance, Data Fabric & Master Data (P172)')
@Controller('edgp')
export class EnterpriseDataController {
  constructor(
    private readonly govSvc: EnterpriseDataGovernanceService,
    private readonly mdmSvc: MasterDataManagementService,
    private readonly fabricSvc: DataFabricService,
    private readonly metadataSvc: MetadataCatalogService,
    private readonly lineageSvc: DataLineageService,
    private readonly qualitySvc: DataQualityService,
    private readonly contractsSvc: DataContractsService,
    private readonly dataopsSvc: DataOpsService,
    private readonly stewardSvc: DataStewardshipService,
    private readonly auditSvc: DataGovernanceAuditService,
  ) {}

  // ── ENTERPRISE DATA GOVERNANCE ──────────────────────────────────────────────

  @Post('governance/domains')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Definir/Atualizar domínio corporativo de dados' })
  @ApiResponse({ status: 201, description: 'Domínio de dados configurado com Data Owner/Steward.' })
  defineDataDomain(@Body() dto: DefineDataDomainDto) {
    return this.govSvc.defineDomain(dto, 'CDO');
  }

  @Get('governance/domains')
  @ApiOperation({ summary: 'Listar domínios corporativos de dados' })
  listDataDomains() {
    return this.govSvc.listDomains();
  }

  @Get('governance/domains/:domain')
  @ApiOperation({ summary: 'Obter detalhamento de domínio por nome' })
  getDataDomain(@Param('domain') domain: DataDomain) {
    const d = this.govSvc.getDomain(domain);
    if (!d) return { error: 'Domínio de dados não encontrado', domain };
    return d;
  }

  // ── MASTER DATA MANAGEMENT (MDM) ────────────────────────────────────────────

  @Post('mdm/golden-records')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar registro mestre (Golden Record) no MDM' })
  createGoldenRecord(@Body() dto: CreateGoldenRecordDto) {
    return this.mdmSvc.createGoldenRecord(dto, 'API_USER');
  }

  @Post('mdm/resolve-identity')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolução probabilística de identidade (Deduplicação MDM)' })
  resolveIdentity(@Body() dto: ResolveIdentityDto) {
    return this.mdmSvc.resolveIdentity(dto);
  }

  @Get('mdm/golden-records')
  @ApiOperation({ summary: 'Listar registros mestres do MDM' })
  @ApiQuery({ name: 'category', required: false, enum: MasterEntityCategory })
  listGoldenRecords(@Query('category') category?: MasterEntityCategory) {
    return this.mdmSvc.listGoldenRecords(category);
  }

  @Get('mdm/golden-records/:goldenId')
  @ApiOperation({ summary: 'Obter Golden Record por ID' })
  getGoldenRecord(@Param('goldenId') goldenId: string) {
    const r = this.mdmSvc.getGoldenRecord(goldenId);
    if (!r) return { error: 'Golden Record não encontrado', goldenId };
    return r;
  }

  // ── DATA FABRIC ─────────────────────────────────────────────────────────────

  @Post('fabric/query')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executar consulta unificada na camada Data Fabric' })
  executeUnifiedFabricQuery(
    @Body('domain') domain: DataDomain,
    @Body('queryFilter') queryFilter: Record<string, any>,
  ) {
    return this.fabricSvc.executeUnifiedQuery(domain, queryFilter ?? {}, 'API_USER');
  }

  @Get('fabric/sources')
  @ApiOperation({ summary: 'Listar fontes de dados conectadas ao Data Fabric' })
  @ApiQuery({ name: 'domain', required: false, enum: DataDomain })
  listFabricSources(@Query('domain') domain?: DataDomain) {
    return this.fabricSvc.listSources(domain);
  }

  // ── METADATA CATALOG ────────────────────────────────────────────────────────

  @Post('metadata/entities')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastrar entidade no Catálogo Corporativo de Metadados' })
  registerMetadataEntity(
    @Body('name') name: string,
    @Body('type') type: any,
    @Body('domain') domain: DataDomain,
    @Body('description') description: string,
    @Body('sensitivity') sensitivity: DataSensitivity,
    @Body('owner') owner: string,
    @Body('tags') tags: string[],
  ) {
    return this.metadataSvc.registerEntity(name, type, domain, description, sensitivity, owner, tags ?? [], 'API_USER');
  }

  @Get('metadata/search')
  @ApiOperation({ summary: 'Pesquisa semântica no catálogo de metadados' })
  @ApiQuery({ name: 'query' })
  @ApiQuery({ name: 'domain', required: false, enum: DataDomain })
  searchMetadataCatalog(
    @Query('query') query: string,
    @Query('domain') domain?: DataDomain,
  ) {
    return this.metadataSvc.searchCatalog(query, domain);
  }

  @Get('metadata/catalog')
  @ApiOperation({ summary: 'Listar catálogo completo de metadados' })
  listMetadataCatalog() {
    return this.metadataSvc.listCatalog();
  }

  // ── DATA LINEAGE ────────────────────────────────────────────────────────────

  @Post('lineage/record')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar grafo de linhagem de dados (Data Lineage)' })
  recordDataLineage(
    @Body('datasetName') datasetName: string,
    @Body('originSystem') originSystem: string,
    @Body('hops') hops: Array<{ sourceSystem: string; targetSystem: string; transformationLogic: string }>,
    @Body('consumers') consumers: string[],
  ) {
    return this.lineageSvc.recordLineage(datasetName, originSystem, hops ?? [], consumers ?? [], 'API_USER');
  }

  @Get('lineage/:datasetName')
  @ApiOperation({ summary: 'Obter linhagem completa de um dataset por nome' })
  getDataLineage(@Param('datasetName') datasetName: string) {
    const l = this.lineageSvc.getLineage(datasetName);
    if (!l) return { error: 'Linhagem de dados não encontrada', datasetName };
    return l;
  }

  @Get('lineage')
  @ApiOperation({ summary: 'Listar grafos de linhagem registrados' })
  listLineages() {
    return this.lineageSvc.listLineages();
  }

  // ── DATA QUALITY ────────────────────────────────────────────────────────────

  @Post('quality/evaluate')
  @ApiOperation({ summary: 'Executar avaliação contínua de qualidade de dados' })
  evaluateDataQuality(@Body('domain') domain: DataDomain) {
    return this.qualitySvc.evaluateQuality(domain, 'API_USER');
  }

  @Get('quality/latest')
  @ApiOperation({ summary: 'Obter último relatório de qualidade do domínio' })
  @ApiQuery({ name: 'domain', enum: DataDomain })
  getLatestQualityReport(@Query('domain') domain: DataDomain) {
    return this.qualitySvc.getLatestReport(domain);
  }

  @Get('quality/reports')
  @ApiOperation({ summary: 'Listar histórico de relatórios de qualidade' })
  listQualityReports() {
    return this.qualitySvc.listReports();
  }

  // ── DATA CONTRACTS ──────────────────────────────────────────────────────────

  @Post('contracts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Publicar Contrato de Dados (Data Contract)' })
  publishDataContract(@Body() dto: PublishDataContractDto) {
    return this.contractsSvc.publishContract(dto, 'API_USER');
  }

  @Post('contracts/:contractId/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validar payload contra o esquema do Data Contract' })
  validatePayloadAgainstContract(
    @Param('contractId') contractId: string,
    @Body('payload') payload: Record<string, any>,
  ) {
    return this.contractsSvc.validatePayloadAgainstContract(contractId, payload);
  }

  @Get('contracts')
  @ApiOperation({ summary: 'Listar contratos de dados publicados' })
  @ApiQuery({ name: 'domain', required: false, enum: DataDomain })
  listDataContracts(@Query('domain') domain?: DataDomain) {
    return this.contractsSvc.listContracts(domain);
  }

  // ── DATAOPS PIPELINES ───────────────────────────────────────────────────────

  @Post('dataops/pipeline/run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executar pipeline DataOps com validação automática' })
  runDataOpsPipeline(
    @Body('pipelineName') pipelineName: string,
    @Body('domain') domain: DataDomain,
    @Body('contractId') contractId: string,
    @Body('payloadBatch') payloadBatch: any[],
  ) {
    return this.dataopsSvc.runPipeline(pipelineName, domain, contractId, payloadBatch ?? [], 'API_USER');
  }

  @Get('dataops/runs')
  @ApiOperation({ summary: 'Listar histórico de execuções de pipelines DataOps' })
  listDataOpsRuns() {
    return this.dataopsSvc.listRuns();
  }

  // ── DATA STEWARDSHIP ────────────────────────────────────────────────────────

  @Post('stewardship/override')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aplicar override operacional de Data Steward' })
  applyStewardOverride(@Body() dto: StewardOverrideDto) {
    return this.stewardSvc.applyStewardOverride(dto);
  }

  @Get('stewardship/logs')
  @ApiOperation({ summary: 'Listar histórico de ações dos Data Stewards' })
  @ApiQuery({ name: 'recordId', required: false })
  listStewardLogs(@Query('recordId') recordId?: string) {
    return this.stewardSvc.listActionLogs(recordId);
  }

  // ── DATA GOVERNANCE AUDIT ───────────────────────────────────────────────────

  @Get('audit')
  @ApiOperation({ summary: 'Trilha imutável de auditoria de governança de dados (SHA-256)' })
  @ApiQuery({ name: 'subject', required: false })
  getAuditTrail(@Query('subject') subject?: string) {
    return this.auditSvc.getAuditTrail(subject);
  }
}

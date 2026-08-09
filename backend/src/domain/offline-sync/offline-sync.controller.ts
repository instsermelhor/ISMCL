import { Controller, Post, Body, HttpCode, HttpStatus, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OfflineSyncService, SyncBatchPayload } from './offline-sync.service';

@ApiTags('Offline Sync — Agentes de Campo')
@ApiBearerAuth()
@Controller({ path: 'sync', version: VERSION_NEUTRAL })
export class OfflineSyncController {
  constructor(private readonly syncService: OfflineSyncService) {}

  @Post('batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sincronizar Lote de Atendimentos Offline (PWA Agentes de Campo)',
    description: 'Recebe o lote acumulado no IndexedDB dos dispositivos de campo e persiste no PostgreSQL.',
  })
  @ApiResponse({ status: 200, description: 'Lote sincronizado com sucesso' })
  async syncBatch(@Body() payload: SyncBatchPayload) {
    return this.syncService.processBatch(payload);
  }
}

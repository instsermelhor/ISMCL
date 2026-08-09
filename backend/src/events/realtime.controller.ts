import { Controller, Get, Sse, MessageEvent, Req, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { FastifyRequest } from 'fastify';
import { Public } from '../shared/decorators/public.decorator';
import { EventBusService, AuraCloudEvent } from './event-bus.service';

/**
 * RealtimeController — Server-Sent Events (SSE) Stream Real-Time Push Gateway
 *
 * Transmite eventos CloudEvents v1.0.3 da Plataforma Aura em tempo real (push)
 * para os clientes conectados (Frontend / Dashboards / Fila de Triagem Live).
 *
 * Eventos transmitidos:
 * - `aura.actg.*` — Teleatendimento & Provedores de Comunicação
 * - `aura.intake.*` / `aura.triage.*` — Fila de Triagem e Acolhimento
 * - `aura.ehr.*` — Prontuário e Assinaturas Clínicas
 * - `aura.auth.*` — Sessões e Segurança
 *
 * Referências: P124 (AEEDA), P125 (AEAP), P143
 */
@ApiTags('Realtime')
@Controller({ path: 'realtime', version: VERSION_NEUTRAL })
export class RealtimeController {
  private readonly eventSubject = new Subject<AuraCloudEvent>();

  constructor(private readonly eventBus: EventBusService) {
    // Inscreve-se em todos os eventos institucionais CloudEvents
    this.eventBus.subscribe('aura.**', (event: AuraCloudEvent) => {
      this.eventSubject.next(event);
    });
  }

  /**
   * SSE Stream endpoint — Conexão contínua em tempo real.
   */
  @Get('stream')
  @Public()
  @Sse()
  @ApiOperation({
    summary: 'SSE Stream — Push de Eventos em Tempo Real',
    description: 'Conecta uma stream SSE (Server-Sent Events) para receber atualizações de triagem, telemedicina e notificações instantâneas.',
  })
  @ApiResponse({ status: 200, description: 'Stream SSE ativa' })
  streamEvents(@Req() req: FastifyRequest): Observable<MessageEvent> {
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    return this.eventSubject.asObservable().pipe(
      map((cloudEvent: AuraCloudEvent) => ({
        id: cloudEvent.id,
        type: cloudEvent.type,
        data: JSON.stringify({
          eventType: cloudEvent.type,
          specversion: cloudEvent.specversion,
          time: cloudEvent.time,
          tenantId: cloudEvent.tenantid,
          payload: cloudEvent.data,
        }),
      })),
    );
  }
}

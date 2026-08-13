import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthCheckService, MemoryHealthIndicator, DiskHealthIndicator, PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaClient } from '@prisma/client';
import { MetricCollectorService } from './metric-collector.service';

describe('HealthController & OpenMetrics Test Suite (PROMPT 197)', () => {
  let controller: HealthController;
  let metricCollector: MetricCollectorService;

  beforeEach(async () => {
    metricCollector = new MetricCollectorService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: {
            check: jest.fn().mockImplementation((indicators) => {
              const results = indicators.map((fn: () => any) => fn());
              return Promise.resolve({ status: 'ok', info: results });
            }),
          },
        },
        {
          provide: MemoryHealthIndicator,
          useValue: {
            checkHeap: jest.fn().mockReturnValue({ memory_heap: { status: 'up' } }),
            checkRSS: jest.fn().mockReturnValue({ memory_rss: { status: 'up' } }),
          },
        },
        {
          provide: DiskHealthIndicator,
          useValue: {
            checkStorage: jest.fn().mockReturnValue({ disk_storage: { status: 'up' } }),
          },
        },
        {
          provide: PrismaHealthIndicator,
          useValue: {
            pingCheck: jest.fn().mockReturnValue({ database: { status: 'up' } }),
          },
        },
        {
          provide: PrismaClient,
          useValue: {},
        },
        {
          provide: MetricCollectorService,
          useValue: metricCollector,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  describe('Kubernetes Probes', () => {
    it('Liveness Probe (/health) deve responder com status ok', async () => {
      const res = await controller.liveness();
      expect(res).toBeDefined();
      expect(res.status).toBe('ok');
    });

    it('Readiness Probe (/health/ready) deve verificar banco, memoria e disco', async () => {
      const res = await controller.readiness();
      expect(res).toBeDefined();
      expect(res.status).toBe('ok');
    });

    it('Startup Probe (/health/startup) deve verificar conexao com banco', async () => {
      const res = await controller.startup();
      expect(res).toBeDefined();
      expect(res.status).toBe('ok');
    });
  });

  describe('Prometheus / OpenMetrics Exporter (/metrics)', () => {
    it('deve formatar e retornar metricas no padrao OpenMetrics', () => {
      metricCollector.recordRequest('GET', 200, 45);
      metricCollector.recordRequest('POST', 201, 120);
      metricCollector.recordRequest('GET', 500, 250);
      metricCollector.recordSecurityViolation();

      const mockReply: any = {
        header: jest.fn().mockReturnThis(),
        send: jest.fn().mockImplementation((payload) => payload),
      };

      controller.getMetrics(mockReply);

      expect(mockReply.header).toHaveBeenCalledWith(
        'Content-Type',
        'text/plain; version=0.0.4; charset=utf-8',
      );
      expect(mockReply.send).toHaveBeenCalled();

      const sentPayload: string = mockReply.send.mock.calls[0][0];
      expect(sentPayload).toContain('aura_uptime_seconds');
      expect(sentPayload).toContain('aura_process_heap_bytes');
      expect(sentPayload).toContain('aura_http_requests_total 3');
      expect(sentPayload).toContain('aura_security_violations_total 1');
      expect(sentPayload).toContain('aura_http_request_duration_ms{quantile="0.95"}');
    });
  });
});

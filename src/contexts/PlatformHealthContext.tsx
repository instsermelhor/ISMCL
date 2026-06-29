// ============================================================
// PLATFORM HEALTH & AUDIT CENTER — CONTEXT
// Instituto Ser Melhor — Plataforma Integrada (Projeto Aura)
// ============================================================

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type {
  PlatformHealthContextType,
  PlatformHealthTab,
  E2eJourney,
  JourneyStep,
  BackupType,
  BackupRecord,
  ReportType,
  GeneratedReport,
  HealthMetric,
  SecurityAlert,
} from '../types/platform-health';
import {
  MOCK_MODULES,
  MOCK_INTEGRATIONS,
  MOCK_JOURNEYS,
  MOCK_LOAD_TESTS,
  MOCK_RESILIENCE_TESTS,
  MOCK_BACKUPS,
  MOCK_SECURITY_ALERTS,
  MOCK_COMPLIANCE,
  MOCK_TRACE_LOGS,
  MOCK_HEALTH_METRICS,
  MOCK_PERMISSION_AUDIT,
  MOCK_REPORTS,
} from '../data/platform-health-mock';

// ─── Context ────────────────────────────────────────────────
const PlatformHealthContext = createContext<PlatformHealthContextType | null>(null);

// ─── Helper ─────────────────────────────────────────────────
function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// ─── Provider ───────────────────────────────────────────────
export function PlatformHealthProvider({ children }: { children: React.ReactNode }) {
  const [modules] = useState(MOCK_MODULES);
  const [integrations] = useState(MOCK_INTEGRATIONS);
  const [journeys, setJourneys] = useState<E2eJourney[]>(MOCK_JOURNEYS);
  const [activeJourneyId, setActiveJourneyId] = useState<string | null>(null);
  const [loadTests, setLoadTests] = useState(MOCK_LOAD_TESTS);
  const [resilienceTests] = useState(MOCK_RESILIENCE_TESTS);
  const [backups, setBackups] = useState<BackupRecord[]>(MOCK_BACKUPS);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>(MOCK_SECURITY_ALERTS);
  const [complianceItems] = useState(MOCK_COMPLIANCE);
  const [traceLogs] = useState(MOCK_TRACE_LOGS);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>(MOCK_HEALTH_METRICS);
  const [permissionAudit] = useState(MOCK_PERMISSION_AUDIT);
  const [reports, setReports] = useState<GeneratedReport[]>(MOCK_REPORTS);
  const [isRunningJourney, setIsRunningJourney] = useState(false);
  const [isRunningLoadTest, setIsRunningLoadTest] = useState(false);
  const [currentTab, setCurrentTab] = useState<PlatformHealthTab>('observability');

  // ─── Simulated real-time health metric ticker ────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setHealthMetrics((prev) => {
        const last = prev[prev.length - 1];
        const now = new Date().toISOString();
        const randomize = (base: number, variance: number) =>
          Math.max(0, Math.min(100, base + (Math.random() - 0.5) * variance * 2));
        const newMetric: HealthMetric = {
          timestamp: now,
          cpuPercent: randomize(last.cpuPercent, 5),
          memoryPercent: randomize(last.memoryPercent, 3),
          dbConnectionsActive: Math.round(randomize(last.dbConnectionsActive, 8)),
          dbConnectionsMax: 500,
          apiLatencyMs: Math.round(randomize(last.apiLatencyMs, 20)),
          activeUsers: Math.round(randomize(last.activeUsers, 10)),
          requestsPerMinute: Math.round(randomize(last.requestsPerMinute, 200)),
          errorRate: Math.max(0, last.errorRate + (Math.random() - 0.5) * 0.02),
          queueDepth: Math.round(Math.max(0, last.queueDepth + (Math.random() - 0.5) * 4)),
        };
        const next = [...prev, newMetric];
        return next.length > 20 ? next.slice(next.length - 20) : next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // ─── Run E2E Journey ────────────────────────────────────
  const runJourney = useCallback(async (journeyId: string) => {
    setIsRunningJourney(true);
    setActiveJourneyId(journeyId);

    // Reset the journey steps to pending
    setJourneys((prev) =>
      prev.map((j) =>
        j.id !== journeyId
          ? j
          : {
              ...j,
              status: 'running',
              totalDurationMs: undefined,
              lastRunAt: undefined,
              steps: j.steps.map((s) => ({ ...s, status: 'pending' as const, durationMs: undefined, error: undefined })),
            }
      )
    );

    await delay(400);

    const journey = journeys.find((j) => j.id === journeyId);
    if (!journey) {
      setIsRunningJourney(false);
      return;
    }

    let totalDuration = 0;
    const stepDelayMs = 1200;

    for (let i = 0; i < journey.steps.length; i++) {
      const step = journey.steps[i];

      // Mark step as running
      setJourneys((prev) =>
        prev.map((j) =>
          j.id !== journeyId
            ? j
            : {
                ...j,
                steps: j.steps.map((s, idx) =>
                  idx === i ? { ...s, status: 'running' as const } : s
                ),
              }
        )
      );

      await delay(stepDelayMs);

      // Simulate step result (95% pass rate)
      const passed = Math.random() > 0.05;
      const stepDuration = Math.round(50 + Math.random() * 300);
      totalDuration += stepDuration;

      const updatedStep: Partial<JourneyStep> = {
        status: passed ? 'passed' : 'failed',
        durationMs: stepDuration,
        error: passed ? undefined : 'Asserção falhou: tempo de resposta excedeu limite de 2000ms.',
      };

      setJourneys((prev) =>
        prev.map((j) =>
          j.id !== journeyId
            ? j
            : {
                ...j,
                steps: j.steps.map((s, idx) => (idx === i ? { ...s, ...updatedStep } : s)),
              }
        )
      );

      if (!passed) break;
    }

    // Finalize journey
    setJourneys((prev) =>
      prev.map((j) => {
        if (j.id !== journeyId) return j;
        const allPassed = j.steps.every((s) => s.status === 'passed');
        const passedCount = j.steps.filter((s) => s.status === 'passed').length;
        return {
          ...j,
          status: allPassed ? 'completed' : 'failed',
          totalDurationMs: totalDuration,
          lastRunAt: new Date().toISOString(),
          passRate: Math.round((passedCount / j.steps.length) * 100),
        };
      })
    );

    setIsRunningJourney(false);
    setActiveJourneyId(null);
  }, [journeys]);

  // ─── Run Load Test ──────────────────────────────────────
  const runLoadTest = useCallback(async (userCount: number) => {
    setIsRunningLoadTest(true);

    // Create a synthetic "running" result
    const tempId = `lt-running-${userCount}`;
    const tempResult = {
      id: tempId,
      name: `Carga — ${userCount.toLocaleString('pt-BR')} Usuários (executando...)`,
      executedAt: new Date().toISOString(),
      durationMinutes: 0,
      status: 'passed' as const,
      dataPoints: [],
      conclusion: 'Aguardando conclusão...',
    };

    setLoadTests((prev) => [tempResult, ...prev]);
    await delay(3000 + Math.random() * 2000);

    const avgResponseMs = Math.round(80 + (userCount / 10000) * 2000);
    const errorRate = userCount >= 10000 ? 1.8 : userCount >= 5000 ? 0.22 : 0.05;
    const cpuPercent = Math.min(98, Math.round(10 + (userCount / 10000) * 90));
    const status = (userCount >= 10000 ? 'failed' : userCount >= 5000 ? 'warning' : 'passed') as 'passed' | 'warning' | 'failed';
    const conclusion =
      status === 'passed'
        ? 'Plataforma estável dentro dos limites de SLA.'
        : status === 'warning'
        ? 'P99 elevado. Recomenda-se revisão do pool de conexões do banco.'
        : 'Timeout detectado em módulos críticos. Necessário ação imediata.';

    const finalResult = {
      id: tempId,
      name: `Carga — ${userCount.toLocaleString('pt-BR')} Usuários Simultâneos`,
      executedAt: new Date().toISOString(),
      durationMinutes: 10,
      status,
      dataPoints: [
        {
          users: userCount,
          avgResponseMs,
          p95ResponseMs: Math.round(avgResponseMs * 2),
          p99ResponseMs: Math.round(avgResponseMs * 2.8),
          errorRate,
          cpuPercent,
          memoryPercent: Math.min(95, Math.round(28 + (userCount / 10000) * 65)),
          dbConnectionsActive: Math.round(18 + (userCount / 10000) * 980),
          requestsPerSecond: Math.round(userCount * 0.98),
        },
      ],
      conclusion,
    };

    setLoadTests((prev) => prev.map((t) => (t.id === tempId ? finalResult : t)));
    setIsRunningLoadTest(false);
  }, []);

  // ─── Trigger Backup ─────────────────────────────────────
  const triggerBackup = useCallback((type: BackupType) => {
    const newBackup: BackupRecord = {
      id: `bkp-manual-${Date.now()}`,
      type,
      status: 'running',
      scheduledAt: new Date().toISOString(),
      sizeGb: 0,
      durationMinutes: 0,
      rtoHours: 1,
      rpoMinutes: type === 'full' ? 0 : 60,
      location: 'GCS Bucket BR-SP/Regiao-1',
      integrityCheck: 'pending',
      notes: `Backup ${type} manual acionado pelo administrador.`,
    };
    setBackups((prev) => [newBackup, ...prev]);

    const duration = type === 'full' ? 8000 : 3000;
    setTimeout(() => {
      setBackups((prev) =>
        prev.map((b) =>
          b.id === newBackup.id
            ? {
                ...b,
                status: 'success',
                completedAt: new Date().toISOString(),
                sizeGb: type === 'full' ? 84.5 : 3.2,
                durationMinutes: type === 'full' ? 42 : 7,
                integrityCheck: 'passed',
              }
            : b
        )
      );
    }, duration);
  }, []);

  // ─── Acknowledge Alert ──────────────────────────────────
  const acknowledgeAlert = useCallback((alertId: string) => {
    setSecurityAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId ? { ...a, status: 'acknowledged' as const } : a
      )
    );
  }, []);

  // ─── Generate Report ────────────────────────────────────
  const generateReport = useCallback((type: ReportType) => {
    setReports((prev) =>
      prev.map((r) => (r.type === type ? { ...r, status: 'generating' as const } : r))
    );
    setTimeout(() => {
      setReports((prev) =>
        prev.map((r) =>
          r.type === type
            ? { ...r, status: 'ready' as const, generatedAt: new Date().toISOString() }
            : r
        )
      );
    }, 2500);
  }, []);

  // ─── Reset Journey ──────────────────────────────────────
  const resetJourney = useCallback((journeyId: string) => {
    setJourneys((prev) =>
      prev.map((j) =>
        j.id !== journeyId
          ? j
          : {
              ...j,
              status: 'idle',
              totalDurationMs: undefined,
              lastRunAt: undefined,
              passRate: undefined,
              steps: j.steps.map((s) => ({ ...s, status: 'pending' as const, durationMs: undefined, error: undefined })),
            }
      )
    );
  }, []);

  const value: PlatformHealthContextType = {
    modules,
    integrations,
    journeys,
    activeJourneyId,
    loadTests,
    resilienceTests,
    backups,
    securityAlerts,
    complianceItems,
    traceLogs,
    healthMetrics,
    permissionAudit,
    reports,
    isRunningJourney,
    isRunningLoadTest,
    currentTab,
    setCurrentTab,
    runJourney,
    runLoadTest,
    triggerBackup,
    acknowledgeAlert,
    generateReport,
    resetJourney,
  };

  return (
    <PlatformHealthContext.Provider value={value}>
      {children}
    </PlatformHealthContext.Provider>
  );
}

export function usePlatformHealth() {
  const ctx = useContext(PlatformHealthContext);
  if (!ctx) throw new Error('usePlatformHealth must be used within PlatformHealthProvider');
  return ctx;
}

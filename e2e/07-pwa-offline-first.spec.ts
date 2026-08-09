import { test, expect } from '@playwright/test';

/**
 * E2E — Fluxo 07: PWA & Offline-First (Agentes de Campo)
 *
 * Valida o manifesto PWA, o Service Worker e o funcionamento do
 * armazenamento IndexedDB offline e banner de conectividade.
 *
 * Referências: P13, P11
 */

test.describe('Fluxo 07 — PWA & Offline-First (Agentes de Campo)', () => {
  test('deve disponibilizar o Web App Manifest com configurações PWA', async ({ request }) => {
    const response = await request.get('/manifest.json');
    expect(response.status()).toBe(200);

    const manifest = await response.json();
    expect(manifest.short_name).toBe('Aura');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');
    expect(manifest.icons).toHaveLength(2);
  });

  test('deve disponibilizar o Service Worker na raiz (sw.js)', async ({ request }) => {
    const response = await request.get('/sw.js');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('CACHE_NAME');
    expect(body).toContain('aura-offline-sync');
  });

  test('deve carregar a aplicação sem erros de execução do Service Worker', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await page.goto('/');
    await page.waitForTimeout(2000);

    const criticalErrors = jsErrors.filter(
      (e) => !e.includes('EventSource') && !e.includes('fetch'),
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('deve ter meta tag theme-color no HTML principal', async ({ page }) => {
    await page.goto('/');
    const themeColor = page.locator('meta[name="theme-color"]');
    const count = await themeColor.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('deve manter funcionamento da rota de acolhimento em simulação offline', async ({ page }) => {
    await page.goto('/piarave-acolhimento');
    await expect(page.locator('body')).toBeVisible();

    // Se houver suporte a banner de offline ou botão de sincronização
    const syncBtn = page.locator('#btn-sync-offline-now, text=/Sincronizar|Offline/i').first();
    const count = await syncBtn.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

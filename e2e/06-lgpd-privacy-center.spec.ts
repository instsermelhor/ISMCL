import { test, expect } from '@playwright/test';

/**
 * E2E — Fluxo 06: Central de Privacidade LGPD
 *
 * Valida o painel de privacidade — consentimento por finalidade,
 * solicitações de direitos do titular (Art. 18) e histórico.
 *
 * Referências: Lei 13.709/2018 (LGPD), P12, P11
 */

test.describe('Fluxo 06 — Central de Privacidade LGPD', () => {
  test('deve exibir a Central de Privacidade sem erros críticos', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await page.goto('/privacy');
    await page.waitForTimeout(2000);

    const criticalErrors = jsErrors.filter(
      (e) => !e.includes('EventSource') && !e.includes('fetch'),
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('deve exibir título "Central de Privacidade"', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('text=/Central de Privacidade/i').first()).toBeVisible({ timeout: 8_000 });
  });

  test('deve exibir referência à LGPD Lei 13.709/2018', async ({ page }) => {
    await page.goto('/privacy');
    await expect(
      page.locator('text=/13.709|LGPD|Proteção de Dados/i').first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test('deve exibir 3 abas: Consentimento, Meus Direitos, Histórico', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('text=/Consentimento/i').first()).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('text=/Direitos/i').first()).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('text=/Histórico/i').first()).toBeVisible({ timeout: 8_000 });
  });

  test('deve exibir finalidades de tratamento na aba de consentimento', async ({ page }) => {
    await page.goto('/privacy');
    await expect(
      page.locator('text=/Saúde Mental|Prontuário|Comunicação|Analytics/i').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('deve exibir botão de conceder/atualizar consentimento', async ({ page }) => {
    await page.goto('/privacy');
    const consentBtn = page.locator('#btn-grant-consent, button').filter({
      hasText: /Conceder|Atualizar Consentimento/i,
    }).first();
    await expect(consentBtn).toBeVisible({ timeout: 8_000 });
  });

  test('deve navegar para aba "Meus Direitos" e exibir opções Art. 18', async ({ page }) => {
    await page.goto('/privacy');

    const rightsTab = page.locator('button').filter({ hasText: /Meus Direitos|Direitos/i }).first();
    await rightsTab.click();

    await expect(
      page.locator('text=/Acesso|Portabilidade|Correção|Exclusão|Esquecimento/i').first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test('deve abrir modal de nova solicitação', async ({ page }) => {
    await page.goto('/privacy');

    // Navega para aba Direitos
    const rightsTab = page.locator('button').filter({ hasText: /Meus Direitos|Direitos/i }).first();
    await rightsTab.click();

    const newRequestBtn = page.locator('#btn-new-request, button').filter({ hasText: /Nova Solicitação/i }).first();
    if (await newRequestBtn.count() > 0) {
      await newRequestBtn.click();
      await expect(
        page.locator('text=/Tipo de Solicitação|Enviar Solicitação|dias úteis/i').first()
      ).toBeVisible({ timeout: 6_000 });
    }
  });

  test('deve informar prazo de 15 dias úteis para resposta', async ({ page }) => {
    await page.goto('/privacy');
    await expect(
      page.locator('text=/15 dias/i').first()
    ).toBeVisible({ timeout: 8_000 });
  });
});

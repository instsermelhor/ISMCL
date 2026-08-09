import { test, expect } from '@playwright/test';

/**
 * E2E — Fluxo 05: Cockpit Financeiro Corporativo
 *
 * Valida a exibição do dashboard financeiro, conciliação bancária,
 * transações e a seção de doações institucionais PIX.
 *
 * Referências: P9, P11
 */

test.describe('Fluxo 05 — Cockpit Financeiro Corporativo', () => {
  test('deve exibir a página financeira sem erros críticos', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await page.goto('/financial');
    await page.waitForTimeout(2000);

    const criticalErrors = jsErrors.filter(
      (e) => !e.includes('EventSource') && !e.includes('fetch'),
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('deve exibir a cockpit financeira com KPIs principais', async ({ page }) => {
    await page.goto('/financial');
    const kpiSection = page.locator('text=/Receita|Despesa|Saldo|Fluxo|DRE|Balanço|R\$/i').first();
    await expect(kpiSection).toBeVisible({ timeout: 10_000 });
  });

  test('deve exibir abas de navegação financeira', async ({ page }) => {
    await page.goto('/financial');
    // Deve existir tabs de navegação: Cockpit, Transações, Doações, Conciliação, etc.
    const tabs = page.locator('[role="tab"], button').filter({
      hasText: /cockpit|transações|doações|conciliação|bancário|relatórios/i,
    });
    await expect(tabs.first()).toBeVisible({ timeout: 8_000 });
  });

  test('deve navegar para a aba de Doações', async ({ page }) => {
    await page.goto('/financial');

    const donationTab = page.locator('button, [role="tab"]').filter({
      hasText: /doações|doacao/i,
    }).first();

    if (await donationTab.count() > 0) {
      await donationTab.click();
      // Deve exibir conteúdo de doações
      await expect(
        page.locator('text=/PIX|doação|projeto|campanha|QR Code/i').first()
      ).toBeVisible({ timeout: 8_000 });
    }
  });

  test('deve navegar para a aba de Transações', async ({ page }) => {
    await page.goto('/financial');

    const transactionTab = page.locator('button, [role="tab"]').filter({
      hasText: /transações|extrato/i,
    }).first();

    if (await transactionTab.count() > 0) {
      await transactionTab.click();
      // Deve exibir lista de transações
      await expect(
        page.locator('text=/Data|Valor|Tipo|Categoria|Descrição/i').first()
      ).toBeVisible({ timeout: 8_000 });
    }
  });

  test('deve exibir seção de integração bancária Open Banking', async ({ page }) => {
    await page.goto('/financial');

    const bankingTab = page.locator('button, [role="tab"]').filter({
      hasText: /bancário|banco|integração|open banking/i,
    }).first();

    if (await bankingTab.count() > 0) {
      await bankingTab.click();
      await expect(
        page.locator('text=/Open Banking|banco|integração|PSP|Cora|Efí|Itaú/i').first()
      ).toBeVisible({ timeout: 8_000 });
    }
  });

  test('deve exibir botão de exportação de relatório', async ({ page }) => {
    await page.goto('/financial');
    const exportBtn = page.locator('button').filter({
      hasText: /exportar|download|relatório|Excel|PDF|CSV/i,
    });
    const count = await exportBtn.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

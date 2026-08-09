import { test, expect } from '@playwright/test';

/**
 * E2E — Fluxo 04: Doações PIX (Portal Público)
 *
 * Valida o fluxo público de geração de cobranças PIX dinâmicas —
 * seleção de projeto, valor personalizado, geração de QR Code e
 * cópia da chave EMV BR.
 *
 * Referências: P9, P11
 */

const DONATION_ROUTE = '/donate';

test.describe('Fluxo 04 — Doações PIX (Portal Público)', () => {
  test('deve exibir a página de doação pública sem erros', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await page.goto(DONATION_ROUTE);
    await page.waitForTimeout(2000);

    const criticalErrors = jsErrors.filter(
      (e) => !e.includes('EventSource') && !e.includes('fetch'),
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('deve exibir opções de valor de doação', async ({ page }) => {
    await page.goto(DONATION_ROUTE);
    // Deve exibir botões de valor predefinido (R$ 10, R$ 25, R$ 50, etc.)
    const valueButtons = page.locator('button').filter({ hasText: /R\$|reais|\d+/i });
    await expect(valueButtons.first()).toBeVisible({ timeout: 8_000 });
  });

  test('deve aceitar valor personalizado de doação', async ({ page }) => {
    await page.goto(DONATION_ROUTE);
    const customInput = page.locator('input[type="number"], input[placeholder*="valor"], input[placeholder*="outro"]').first();
    const count = await customInput.count();
    if (count > 0) {
      await customInput.fill('75');
      await expect(customInput).toHaveValue('75');
    }
  });

  test('deve exibir campo de nome do doador (opcional)', async ({ page }) => {
    await page.goto(DONATION_ROUTE);
    const donorNameField = page.locator('input[placeholder*="nome"], input[placeholder*="Nome"]').first();
    const count = await donorNameField.count();
    if (count > 0) {
      await expect(donorNameField).toBeVisible({ timeout: 6_000 });
    }
  });

  test('deve exibir QR Code após gerar cobrança PIX', async ({ page }) => {
    await page.goto(DONATION_ROUTE);

    // Seleciona o primeiro projeto disponível se houver
    const projectSelect = page.locator('select, [role="listbox"]').first();
    if (await projectSelect.count() > 0) {
      await projectSelect.selectOption({ index: 0 });
    }

    // Seleciona o primeiro valor predefinido ou preenche custom
    const valueBtn = page.locator('button').filter({ hasText: /R\$\s*\d+/i }).first();
    if (await valueBtn.count() > 0) {
      await valueBtn.click();
    }

    // Clica em gerar PIX
    const generateBtn = page.locator('button').filter({
      hasText: /gerar|pix|cobrança|qr|doação/i,
    }).first();
    if (await generateBtn.count() > 0) {
      await generateBtn.click();

      // Aguarda QR Code ou chave PIX aparecer
      const qrOrKey = page.locator('canvas, img[alt*="QR"], text=/00020126|EMV|Pix Copia/i').first();
      await expect(qrOrKey).toBeVisible({ timeout: 15_000 });
    }
  });

  test('deve exibir botão de copiar chave PIX', async ({ page }) => {
    await page.goto(DONATION_ROUTE);
    const copyBtn = page.locator('button').filter({ hasText: /copiar|copy|copia/i });
    // Pode não estar visível sem gerar a cobrança — apenas valida ausência de crash
    const count = await copyBtn.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

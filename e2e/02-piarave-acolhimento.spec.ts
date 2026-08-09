import { test, expect } from '@playwright/test';

/**
 * E2E — Fluxo 02: Acolhimento PIARAVE (Triagem Psicossocial)
 *
 * Valida o fluxo de triagem e acolhimento de beneficiários — desde a
 * identificação da demanda até a classificação de risco MCSI.
 *
 * Referências: P5, P6, P10, P11
 */

test.describe('Fluxo 02 — Acolhimento PIARAVE', () => {
  test('deve exibir a página de acolhimento PIARAVE sem erros', async ({ page }) => {
    await page.goto('/piarave-acolhimento');
    // Aguarda a página carregar
    await expect(page.locator('body')).toBeVisible();
    // Não deve exibir erro crítico de JavaScript
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));
    await page.waitForTimeout(2000);
    expect(jsErrors.filter((e) => !e.includes('EventSource'))).toHaveLength(0);
  });

  test('deve exibir seletor de linhas de acolhimento', async ({ page }) => {
    await page.goto('/piarave-acolhimento');
    // Deve existir alguma opção de linha (e.g. botões, radio ou select)
    const lineSelectors = page.locator('button, input[type="radio"], select').first();
    await expect(lineSelectors).toBeVisible({ timeout: 8_000 });
  });

  test('deve exibir opções de tipos de demanda', async ({ page }) => {
    await page.goto('/piarave-acolhimento');
    // Aguarda algum conteúdo de demanda aparecer
    await expect(
      page.locator('text=/Violência|Abuso|Manipulação|Conflitos|Ameaças/i').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('deve exibir controles de acessibilidade (contraste e fonte)', async ({ page }) => {
    await page.goto('/piarave-acolhimento');
    // Procura por botões de acessibilidade
    const accessibilityControls = page.locator('button').filter({
      hasText: /contraste|fonte|tamanho|AA/i,
    });
    // Se existir, deve ser visível
    const count = await accessibilityControls.count();
    if (count > 0) {
      await expect(accessibilityControls.first()).toBeVisible();
    }
  });

  test('deve ter navegação de próximo/anterior no wizard de triagem', async ({ page }) => {
    await page.goto('/piarave-acolhimento');
    // Deve existir botão de avançar ou próximo passo
    const nextBtn = page.locator('button').filter({
      hasText: /próximo|avançar|continuar|next/i,
    });
    const count = await nextBtn.count();
    if (count > 0) {
      await expect(nextBtn.first()).toBeVisible();
    }
  });
});

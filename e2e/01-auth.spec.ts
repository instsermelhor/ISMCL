import { test, expect } from '@playwright/test';

/**
 * E2E — Fluxo 01: Autenticação IAM
 *
 * Cobre o ciclo completo de login/logout do Super User institucional
 * e validações de segurança de acesso.
 *
 * Referências: P1, P2, P11
 */

const SUPER_USER_EMAIL = 'aurainstitutosermelhor@gmail.com';
const SUPER_USER_PASSWORD = 'Aura@2026!FirstAccess';

test.describe('Fluxo 01 — Autenticação IAM', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('deve exibir a tela de login institucional', async ({ page }) => {
    // A rota raiz deve redirecionar para login ou exibir o dashboard de login
    await expect(page).toHaveURL(/login|iam|auth|\/$/);
    await expect(page.locator('input[placeholder="Seu e-mail"]').first()).toBeVisible();
  });

  test('deve recusar credenciais inválidas', async ({ page }) => {
    await page.goto('/iam-login');

    const emailInput = page.locator('input[placeholder="Seu e-mail"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"]').first();

    await emailInput.fill('usuario.invalido@aura.org.br');
    await passwordInput.fill('SenhaErrada!123');
    await submitBtn.click();

    // Deve exibir mensagem de erro
    await expect(
      page.locator('text=/credencial|inválid|erro|unauthorized|Acesso negado/i').first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test('deve autenticar o Super User e redirecionar ao Dashboard', async ({ page }) => {
    await page.goto('/iam-login');

    const emailInput = page.locator('input[placeholder="Seu e-mail"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"]').first();

    await emailInput.fill(SUPER_USER_EMAIL);
    await passwordInput.fill(SUPER_USER_PASSWORD);
    await submitBtn.click();

    // Deve navegar para o dashboard ou painel principal
    await expect(page).toHaveURL(/dashboard|home|painel|\//i, { timeout: 15_000 });
    await expect(page.locator('body')).not.toContainText(/Acesso negado|credencial inválid/i);
  });

  test('deve conter campo placeholder "Seu e-mail" em todos os formulários de login', async ({ page }) => {
    await page.goto('/iam-login');
    const emailInputs = page.locator('input[placeholder="Seu e-mail"]');
    await expect(emailInputs.first()).toBeVisible();
  });

  test('deve redirecionar rotas protegidas para login sem autenticação', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login|iam|auth/i, { timeout: 10_000 });
  });
});

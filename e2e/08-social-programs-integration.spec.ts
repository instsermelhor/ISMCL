import { test, expect } from '@playwright/test';

test.describe('Integração CGI-Gestão ↔ Página Pública de Programas Sociais', () => {
  test('deve acessar a rota pública /programas e exibir os programas ativos', async ({ page }) => {
    await page.goto('/programas');
    await page.waitForLoadState('networkidle');

    // Verifica hero e título
    await expect(page.getByRole('heading', { name: /Nossos Programas Sociais/i })).toBeVisible();

    // Verifica programas padrão
    await expect(page.getByText('Escuta Ativa')).toBeVisible();
    await expect(page.getByText('Lar Protegido')).toBeVisible();
    await expect(page.getByText('Envelhecer Bem')).toBeVisible();
  });

  test('deve abrir o modal de detalhes de um programa público', async ({ page }) => {
    await page.goto('/programas');
    await page.waitForLoadState('networkidle');

    // Clica no card do programa Escuta Ativa
    await page.getByText('Escuta Ativa').click();

    // Modal de detalhes deve aparecer com informações completas
    await expect(page.getByRole('heading', { name: 'Escuta Ativa' })).toBeVisible();
    await expect(page.getByText('Dra. Roberta Santos')).toBeVisible();
    await expect(page.getByRole('button', { name: /Solicitar participação/i })).toBeVisible();
  });

  test('deve redirecionar para /acolhimento ao clicar no CTA de participação', async ({ page }) => {
    await page.goto('/programas');
    await page.waitForLoadState('networkidle');

    // Clica no card Escuta Ativa
    await page.getByText('Escuta Ativa').click();

    // Clica no botão de solicitar acolhimento
    await page.getByRole('button', { name: /Solicitar participação/i }).click();

    // Deve redirecionar para a rota de acolhimento
    await expect(page).toHaveURL(/\/acolhimento/);
  });
});

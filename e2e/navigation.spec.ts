import { test, expect } from '@playwright/test';
import { login, openMobileNavIfNeeded } from './helpers';

test.describe('Navegación autenticada', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await openMobileNavIfNeeded(page);
  });

  test('el shell (sidebar + topbar) se renderiza tras login', async ({ page }) => {
    const sidebar = page.getByRole('complementary');
    await expect(sidebar.getByRole('button', { name: 'Leads' })).toBeVisible();
    await expect(sidebar.getByRole('button', { name: 'Clientes' })).toBeVisible();
  });

  test('navega a Leads vía el sidebar', async ({ page }) => {
    await page.getByRole('complementary').getByRole('button', { name: 'Leads' }).click();
    await expect(page).toHaveURL(/\/crm\/leads/);
  });

  test('navega a Clientes vía el sidebar', async ({ page }) => {
    await page.getByRole('complementary').getByRole('button', { name: 'Clientes' }).click();
    await expect(page).toHaveURL(/\/crm\/clientes/);
  });

  test('rutas protegidas redirigen a login si no hay sesión', async ({ page, context }) => {
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.goto('/crm/dashboard');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('logout vuelve a la pantalla de login', async ({ page }) => {
    await page.getByTitle('Cerrar sesión').click();
    // El logout pide confirmación vía app-confirm-dialog antes de cerrar sesión.
    await page.getByTestId('confirm-dialog-accept').click();
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
  });
});

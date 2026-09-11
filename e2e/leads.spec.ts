import { test, expect } from '@playwright/test';
import { login, openMobileNavIfNeeded } from './helpers';

test.describe('Leads (CRM)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await openMobileNavIfNeeded(page);
    await page.getByRole('complementary').getByRole('button', { name: 'Leads' }).click();
    await expect(page).toHaveURL(/\/crm\/leads/);
  });

  test('el buscador filtra la lista sin errores', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    const search = page.getByPlaceholder('Buscar leads…');
    await search.fill('zzz-no-deberia-existir-zzz');
    await expect(search).toHaveValue('zzz-no-deberia-existir-zzz');
    // El mensaje exacto de vacío depende de si la cuenta ya tenía 0 leads o no;
    // lo que importa es que filtrar no rompa la pantalla.
    await expect(page.getByText(/Aún no tienes leads|No se encontraron leads/)).toBeVisible({ timeout: 5_000 });
    expect(errors).toEqual([]);
  });

  test('abre y cierra el modal de nuevo lead', async ({ page }) => {
    await page.getByRole('button', { name: 'Nuevo Lead' }).first().click();
    await expect(page.getByRole('heading', { name: 'Nuevo Lead' })).toBeVisible();
    await page.getByLabel('Cerrar').click();
    await expect(page.getByRole('heading', { name: 'Nuevo Lead' })).not.toBeVisible();
  });

  test('valida título requerido al crear', async ({ page }) => {
    await page.getByRole('button', { name: 'Nuevo Lead' }).first().click();
    await page.getByRole('button', { name: 'Crear Lead' }).click();
    await expect(page.getByText('El título del lead es obligatorio.')).toBeVisible();
    // No debe navegar ni crashear; el modal sigue abierto porque falta el título.
    await expect(page.getByRole('heading', { name: 'Nuevo Lead' })).toBeVisible();
  });
});

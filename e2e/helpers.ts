import { Page, expect } from '@playwright/test';
import { TEST_USER } from './fixtures';

export async function login(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(TEST_USER.email);
  await page.getByLabel('Contraseña', { exact: true }).fill(TEST_USER.password);
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
  await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 15_000 });
}

/**
 * En viewports angostos (< 768px, el breakpoint md de Tailwind) el sidebar es un drawer
 * fuera de pantalla hasta que se abre con el botón "Abrir menú" de la tabbar inferior.
 * Los mismos botones de navegación (Leads, Clientes, "Cerrar sesión"...) viven en ese
 * mismo <aside>, así que hay que abrirlo antes de interactuar con ellos en mobile.
 */
export async function openMobileNavIfNeeded(page: Page) {
  const width = page.viewportSize()?.width ?? 1280;
  if (width < 768) {
    await page.getByRole('button', { name: 'Abrir menú' }).first().click();
  }
}

import { test, expect } from '@playwright/test';
import { login } from './helpers';

// Screenshots de referencia para revisión manual de layout/responsive.
// No son pixel-diff tests (el contenido de datos cambia entre corridas);
// sirven para detectar overflow, desalineación o regresiones visuales evidentes.
test.describe('Screenshots de referencia', () => {
  test('login', async ({ page }, testInfo) => {
    await page.goto('/auth/login');
    // La tarjeta del formulario tiene una animación fade-in (opacity 0 -> 1, delay .35s + .6s de
    // duración); Playwright considera "visible" un elemento con opacity:0, así que hay que esperar
    // explícitamente a que la animación termine para que el screenshot no la capture transparente.
    await expect(page.locator('.fade-up--d3')).toHaveCSS('opacity', '1', { timeout: 3_000 });
    await page.screenshot({ path: `e2e/screenshots/login-${testInfo.project.name}.png`, fullPage: true });
  });

  test('dashboard', async ({ page }, testInfo) => {
    await login(page);
    await page.waitForLoadState('networkidle');
    // Las tarjetas del dashboard entran con animaciones scale-in/card-enter escalonadas;
    // se espera a que termine la más tardía antes de capturar.
    await page.waitForTimeout(800);
    await page.screenshot({ path: `e2e/screenshots/dashboard-${testInfo.project.name}.png`, fullPage: true });
  });
});

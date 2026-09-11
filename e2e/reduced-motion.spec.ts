import { test, expect } from '@playwright/test';

test.describe('prefers-reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('respeta la preferencia del sistema sin romper la carga', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/auth/login');
    await expect(page.getByRole('button', { name: 'Iniciar Sesión' })).toBeVisible();

    // .fade-up--d3 usa una animación por keyframes (no transition) para su fade-in;
    // con reduced-motion, animation-duration debe colapsar a ~0 en vez de los .6s normales.
    const duration = await page.locator('.fade-up--d3').evaluate((el) => getComputedStyle(el).animationDuration);
    expect(parseFloat(duration)).toBeLessThan(0.05);

    expect(errors).toEqual([]);
  });
});

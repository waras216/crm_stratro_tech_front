import { test, expect } from '@playwright/test';
import { TEST_USER } from './fixtures';

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('carga el formulario con sus campos y accesible names correctos', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Strato Hub' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Contraseña', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Iniciar Sesión' })).toBeVisible();
  });

  test('valida campos requeridos antes de llamar al backend', async ({ page }) => {
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    await expect(page.getByRole('alert')).toHaveText('Completa todos los campos');
  });

  test('muestra error con credenciales inválidas', async ({ page }) => {
    await page.getByLabel('Email').fill('no-existe@demo.com');
    await page.getByLabel('Contraseña', { exact: true }).fill('password-incorrecto');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    await expect(page.getByRole('alert')).toHaveText('Credenciales incorrectas', { timeout: 10_000 });
  });

  test('muestra estado de carga mientras se autentica', async ({ page }) => {
    await page.getByLabel('Email').fill(TEST_USER.email);
    await page.getByLabel('Contraseña', { exact: true }).fill(TEST_USER.password);
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    await expect(page.getByRole('button', { name: 'Iniciando sesión...' })).toBeVisible();
  });

  test('login exitoso navega fuera de /auth/login', async ({ page }) => {
    await page.getByLabel('Email').fill(TEST_USER.email);
    await page.getByLabel('Contraseña', { exact: true }).fill(TEST_USER.password);
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 15_000 });
  });

  test('el botón mostrar/ocultar contraseña alterna el tipo del input', async ({ page }) => {
    const password = page.getByLabel('Contraseña', { exact: true });
    await password.fill('secreto123');
    await expect(password).toHaveAttribute('type', 'password');

    const toggle = page.getByRole('button', { name: 'Mostrar contraseña' });
    await toggle.click();
    await expect(password).toHaveAttribute('type', 'text');
    await expect(page.getByRole('button', { name: 'Ocultar contraseña' })).toBeVisible();

    await page.getByRole('button', { name: 'Ocultar contraseña' }).click();
    await expect(password).toHaveAttribute('type', 'password');
  });

  test('sin JS errors visibles en consola al cargar', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });
});

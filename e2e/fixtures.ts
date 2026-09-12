// Credenciales de un usuario sembrado por MasterSeeder para desarrollo local
// (pos_api_laravel/database/seeders/MasterSeeder.php) — no son un secreto de producción.
// Sobreescribibles vía variables de entorno para correr contra otro dataset.
export const TEST_USER = {
  email: process.env.E2E_EMAIL ?? 'admin@demo.com',
  password: process.env.E2E_PASSWORD ?? '123456',
};

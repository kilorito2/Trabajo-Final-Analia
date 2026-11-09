import { defineConfig } from '@playwright/test';

// No corre con `npm test`. Necesita la app levantada (por defecto `npm run dev` con el
// backend en modo demo); CAPTURAS_URL permite apuntar, por ejemplo, a la imagen Docker.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.CAPTURAS_URL ?? 'http://localhost:5173',
    viewport: { width: 1366, height: 768 },
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Buenos_Aires',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});

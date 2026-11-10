import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Recorre cada pantalla como admin, guarda una captura en docs/capturas/ y falla si axe
// encuentra violaciones serias o críticas. Sirve también como prueba de humo.
const USUARIO = process.env.CAPTURAS_USUARIO ?? 'admin';
const PASSWORD = process.env.CAPTURAS_PASSWORD ?? 'demo1234';
const CARPETA = '../docs/capturas';

async function capturar(page: Page, nombre: string) {
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  const resultado = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const graves = resultado.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(
    graves.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`),
    `Violaciones de accesibilidad en ${nombre}`,
  ).toEqual([]);
  await page.screenshot({ path: `${CARPETA}/${nombre}.png` });
}

test('capturas de todas las pantallas', async ({ page }) => {
  const erroresConsola: string[] = [];
  page.on('console', (mensaje) => {
    if (mensaje.type() === 'error') erroresConsola.push(mensaje.text());
  });

  await page.goto('/recuperar');
  await capturar(page, '00-recuperar-contrasena');

  await page.goto('/ingresar');
  await capturar(page, '01-ingreso');
  await page.getByLabel('Usuario').fill(USUARIO);
  await page.getByLabel('Contraseña').fill(PASSWORD);
  await page.getByRole('button', { name: 'Ingresar' }).click();

  await expect(page.getByRole('heading', { name: 'Panel', level: 1 })).toBeVisible();
  await capturar(page, '02-panel');

  await page.goto('/medicamentos');
  await expect(page.getByRole('heading', { name: 'Medicamentos', level: 1 })).toBeVisible();
  await capturar(page, '03-medicamentos');

  await page.getByRole('table').getByRole('link').first().click();
  await expect(page.getByRole('heading', { name: 'Lotes con stock' })).toBeVisible();
  await capturar(page, '04-medicamento-detalle');

  await page.goto('/medicamentos/nuevo');
  await capturar(page, '05-medicamento-nuevo');

  await page.goto('/ingresos/nuevo');
  await expect(page.getByRole('heading', { name: 'Ingreso de mercadería' })).toBeVisible();
  await capturar(page, '06-ingreso-mercaderia');

  await page.goto('/transferencias/nueva');
  await page.getByRole('combobox', { name: /Área de destino/ }).selectOption({ label: 'Guardia' });
  await page.getByRole('combobox', { name: /Medicamento/ }).fill('para');
  await page.getByRole('listbox', { name: 'Medicamento' }).getByRole('option').first().click();
  await page.getByRole('spinbutton', { name: 'Cantidad a agregar' }).fill('10');
  await page.getByRole('button', { name: 'Agregar' }).click();
  await capturar(page, '07-nueva-transferencia');
  await page.getByRole('button', { name: 'Descartar' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Descartar' }).click();

  await page.goto('/transferencias');
  await expect(page.getByRole('heading', { name: 'Transferencias', level: 1 })).toBeVisible();
  await capturar(page, '08-transferencias');

  await page.getByRole('table').getByRole('link').first().click();
  await expect(page.getByRole('button', { name: 'Imprimir' })).toBeVisible();
  await capturar(page, '09-comprobante');

  await page.goto('/lotes?vista=vencidos');
  await expect(page.getByRole('heading', { name: 'Lotes y vencimientos' })).toBeVisible();
  await capturar(page, '10-lotes-vencidos');

  await page.goto('/proveedores');
  await capturar(page, '11-proveedores');

  await page.goto('/areas');
  await capturar(page, '12-areas');

  await page.goto('/usuarios');
  await capturar(page, '13-usuarios');

  await page.goto('/cuenta');
  await capturar(page, '14-mi-cuenta');

  await page.goto('/reportes');
  await expect(page.getByRole('heading', { name: 'Reportes', level: 1 })).toBeVisible();
  await capturar(page, '15-reportes');

  expect(erroresConsola, 'Errores en la consola del navegador').toEqual([]);
});

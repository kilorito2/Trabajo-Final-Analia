import { expect, test, type Browser, type Page } from '@playwright/test';

// Recorre el sistema como lo haría una persona: crea, edita, busca, da de baja y reactiva en cada
// pantalla, prueba los errores de validación y de negocio, y los permisos por rol. Modifica datos:
// correrlo contra el perfil demo. Todo lo que crea lleva el mismo sufijo para reconocerlo.
//   npm run e2e:recorrido      (con la app levantada; CAPTURAS_PASSWORD = contraseña del admin)

const ADMIN = process.env.CAPTURAS_USUARIO ?? 'admin';
const ADMIN_PASSWORD = process.env.CAPTURAS_PASSWORD ?? 'demo1234';
const S = String(Date.now()).slice(-6);

const AREA = `Área Prueba ${S}`;
const PROVEEDOR = `Proveedor Prueba ${S} S.A.`;
const CODIGO = `PRB-${S}`;
const NOMBRE = `Pruebamicina ${S}`;
const LOTE_CERCANO = `PA${S}`;
const LOTE_LEJANO = `PB${S}`;
const USUARIO = `prueba${S}`;

/** Fecha de hoy + días, en la zona de Argentina, como la espera un input date. */
function fecha(dias: number): string {
  const ahora = new Date(Date.now() + dias * 86_400_000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(ahora);
}

/** Un CUIT con dígito verificador válido y distinto en cada corrida. */
function cuitValido(): string {
  for (let n = 0; ; n++) {
    const base = `30${S}${String(n).padStart(2, '0')}`;
    const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    const suma = [...base].reduce((acc, d, i) => acc + Number(d) * pesos[i], 0);
    const dv = 11 - (suma % 11);
    if (dv === 10) continue;
    return `${base}${dv === 11 ? 0 : dv}`;
  }
}

async function ingresar(page: Page, usuario: string, password: string) {
  await page.goto('/ingresar');
  await page.getByLabel('Usuario').fill(usuario);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('heading', { name: 'Panel', level: 1 })).toBeVisible();
}

async function salir(page: Page) {
  await page.getByRole('button', { name: 'Salir' }).click();
  await expect(page.getByRole('heading', { name: 'Ingresar' })).toBeVisible();
}

/**
 * Espera el aviso de éxito y que se cierre el cuadro de diálogo: la lista se actualiza un instante
 * antes de que el cuadro se cierre, y mientras está abierto el resto de la página no recibe clics.
 */
async function aviso(page: Page, texto: string | RegExp) {
  await expect(page.locator('.aviso').filter({ hasText: texto }).first()).toBeVisible();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
}

const dialogo = (page: Page) => page.getByRole('dialog');

async function nuevaSesion(browser: Browser) {
  const contexto = await browser.newContext();
  return contexto.newPage();
}

test.describe.configure({ mode: 'serial' });
test.setTimeout(120_000);

test.describe('Recorrido completo', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await nuevaSesion(browser);
    await ingresar(page, ADMIN, ADMIN_PASSWORD);
  });

  test('áreas: crear, repetida, editar, dar de baja y reactivar', async () => {
    await page.goto('/areas');
    await page.getByRole('button', { name: 'Nueva área' }).click();
    await dialogo(page).getByLabel('Nombre').fill(AREA);
    await dialogo(page).getByRole('button', { name: 'Guardar' }).click();
    await aviso(page, `Se creó el área ${AREA}`);

    await page.getByRole('button', { name: 'Nueva área' }).click();
    await dialogo(page).getByLabel('Nombre').fill(AREA.toUpperCase());
    await dialogo(page).getByRole('button', { name: 'Guardar' }).click();
    await expect(dialogo(page)).toContainText('Ya existe un área');
    await dialogo(page).getByRole('button', { name: 'Cancelar' }).click();

    await page.getByLabel('Buscar por nombre').fill(S);
    await expect(page.getByRole('row')).toHaveCount(2);
    await page.getByRole('button', { name: `Editar ${AREA}` }).click();
    await dialogo(page).getByLabel('Nombre').fill(`${AREA} editada`);
    await dialogo(page).getByRole('button', { name: 'Guardar' }).click();
    await aviso(page, `Se actualizó el área ${AREA} editada`);

    await page.getByRole('button', { name: `Dar de baja ${AREA} editada` }).click();
    await dialogo(page).getByRole('button', { name: 'Dar de baja' }).click();
    await aviso(page, `Se dio de baja el área ${AREA} editada`);
    await expect(page.getByText('No hay áreas', { exact: false })).toBeVisible();

    await page.getByLabel('Incluir inactivas').check();
    await page.getByRole('button', { name: `Reactivar ${AREA} editada` }).click();
    await dialogo(page).getByRole('button', { name: 'Reactivar' }).click();
    await aviso(page, `Se reactivó el área ${AREA} editada`);
  });

  test('proveedores: CUIT inválido, crear, editar, baja y reactivación', async () => {
    await page.goto('/proveedores');
    await page.getByRole('button', { name: 'Nuevo proveedor' }).click();
    await dialogo(page).getByLabel('Razón social').fill(PROVEEDOR);
    await dialogo(page).getByLabel('CUIT').fill('20-12345678-5');
    await dialogo(page).getByRole('button', { name: 'Guardar' }).click();
    await expect(dialogo(page)).toContainText(/CUIT/i);
    await expect(dialogo(page)).toBeVisible();

    await dialogo(page).getByLabel('CUIT').fill(cuitValido());
    await dialogo(page).getByRole('button', { name: 'Guardar' }).click();
    await aviso(page, `Se guardó el proveedor ${PROVEEDOR}`);

    await page.getByLabel('Buscar por razón social o CUIT').fill(PROVEEDOR);
    await page.getByRole('button', { name: `Editar ${PROVEEDOR}` }).click();
    await dialogo(page).getByLabel('Teléfono').fill('0351 555-1234');
    await dialogo(page).getByLabel('Email').fill(`ventas${S}@prueba.com`);
    await dialogo(page).getByRole('button', { name: 'Guardar' }).click();
    await aviso(page, `Se guardó el proveedor ${PROVEEDOR}`);
    await expect(page.getByRole('row', { name: new RegExp(PROVEEDOR) })).toContainText('0351 555-1234');

    await page.getByRole('button', { name: `Dar de baja ${PROVEEDOR}` }).click();
    await dialogo(page).getByRole('button', { name: 'Dar de baja' }).click();
    await aviso(page, /Se dio de baja/);
    await page.getByLabel('Incluir inactivos').check();
    await page.getByRole('button', { name: `Reactivar ${PROVEEDOR}` }).click();
    await dialogo(page).getByRole('button', { name: 'Reactivar' }).click();
    await aviso(page, /Se reactivó/);
  });

  test('medicamentos: crear, código repetido y editar', async () => {
    await page.goto('/medicamentos/nuevo');
    await page.getByLabel('Código').fill(CODIGO.toLowerCase());
    await page.getByLabel('Nombre').fill(NOMBRE);
    await page.getByLabel('Presentación').fill('comprimidos 10 mg');
    await page.getByLabel('Stock mínimo').fill('5');
    await page.getByRole('button', { name: 'Guardar' }).click();
    await aviso(page, `Se guardó ${NOMBRE}`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(NOMBRE);
    // El código se guarda en mayúsculas.
    await expect(page.getByText(CODIGO, { exact: true })).toBeVisible();

    await page.goto('/medicamentos/nuevo');
    await page.getByLabel('Código').fill(CODIGO);
    await page.getByLabel('Nombre').fill('Otro');
    await page.getByLabel('Presentación').fill('ampolla');
    await page.getByLabel('Stock mínimo').fill('1');
    await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText(/Ya existe un medicamento con el código/)).toBeVisible();

    await page.goto('/medicamentos');
    await page.getByLabel('Buscar por código o nombre').fill(CODIGO);
    await page.getByRole('link', { name: NOMBRE }).click();
    await page.getByRole('link', { name: 'Editar' }).click();
    await page.getByLabel('Stock mínimo').fill('50');
    await page.getByRole('button', { name: 'Guardar' }).click();
    await aviso(page, `Se guardó ${NOMBRE}`);
    await expect(page.locator('.dato').filter({ hasText: 'Stock mínimo' })).toContainText('50');
  });

  test('ingreso de mercadería: fecha pasada, aviso de vencimiento, dos lotes y lote repetido', async () => {
    await page.goto('/ingresos/nuevo');
    const elegirMedicamento = async () => {
      await page.getByRole('combobox', { name: /Medicamento/ }).fill(CODIGO);
      await page.getByRole('option').filter({ hasText: NOMBRE }).click();
    };
    const completar = async (lote: string, vence: string, cantidad: string) => {
      await page.getByLabel(/Número de lote/).fill(lote);
      await page.getByLabel(/Fecha de vencimiento/).fill(vence);
      await page.getByLabel(/^Cantidad/).fill(cantidad);
    };

    await elegirMedicamento();
    await page.getByLabel(/Proveedor/).selectOption({ label: PROVEEDOR });
    await completar(LOTE_CERCANO, fecha(-1), '30');
    await page.getByRole('button', { name: 'Registrar ingreso' }).click();
    await expect(page.getByText(/no puede ser anterior a hoy/)).toBeVisible();

    await page.getByLabel(/Fecha de vencimiento/).fill(fecha(10));
    await page.getByLabel(/^Cantidad/).click();
    await expect(page.getByText('Podés registrarlo igual.')).toBeVisible();
    await page.getByRole('button', { name: 'Registrar ingreso' }).click();
    await expect(page.getByText(`Se registró el lote ${LOTE_CERCANO}`)).toBeVisible();

    await page.getByRole('button', { name: 'Registrar otro lote' }).click();
    await elegirMedicamento();
    await expect(page.getByLabel(/Proveedor/)).toHaveValue(/\d+/);
    await completar(LOTE_LEJANO, fecha(200), '100');
    await page.getByRole('button', { name: 'Registrar ingreso' }).click();
    await expect(page.getByText(`Se registró el lote ${LOTE_LEJANO}`)).toBeVisible();
    await expect(page.getByText(/Stock de .*: 130/)).toBeVisible();

    await page.getByRole('button', { name: 'Registrar otro lote' }).click();
    await elegirMedicamento();
    await completar(LOTE_LEJANO, fecha(300), '5');
    await page.getByRole('button', { name: 'Registrar ingreso' }).click();
    await expect(page.getByText(/ya está registrado/)).toBeVisible();
  });

  test('transferencia: FEFO con dos lotes y stock insuficiente sin descontar nada', async () => {
    await page.goto('/transferencias/nueva');
    await page.getByRole('combobox', { name: /Área de destino/ }).selectOption({ label: `${AREA} editada` });
    await page.getByRole('combobox', { name: /Medicamento/ }).fill(CODIGO);
    await page.getByRole('option').filter({ hasText: NOMBRE }).click();
    await page.getByLabel('Cantidad a agregar').fill('50');
    await page.getByRole('button', { name: 'Agregar' }).click();
    await page.getByRole('textbox', { name: 'Observaciones' }).fill(`Prueba automática ${S}`);
    await page.getByRole('button', { name: 'Revisar y confirmar' }).click();
    await dialogo(page).getByRole('button', { name: 'Confirmar transferencia' }).click();

    await aviso(page, /Se registró la transferencia TR-/);
    // FEFO: primero los 30 del lote que vence antes y después 20 del otro.
    await expect(page.getByRole('row', { name: new RegExp(LOTE_CERCANO) })).toContainText('30');
    await expect(page.getByRole('row', { name: new RegExp(LOTE_LEJANO) })).toContainText('20');
    await expect(page.getByText(`Prueba automática ${S}`)).toBeVisible();

    await page.goto('/transferencias/nueva');
    await page.getByRole('combobox', { name: /Área de destino/ }).selectOption({ label: `${AREA} editada` });
    await page.getByRole('combobox', { name: /Medicamento/ }).fill(CODIGO);
    await page.getByRole('option').filter({ hasText: NOMBRE }).click();
    await page.getByLabel('Cantidad a agregar').fill('10');
    await page.getByRole('button', { name: 'Agregar' }).click();
    // Mientras tanto, el stock cambia por fuera (otra persona): se ajusta el lote a 5 por la API.
    const otra = await nuevaSesion(page.context().browser()!);
    await ingresar(otra, ADMIN, ADMIN_PASSWORD);
    await otra.goto(`/lotes?vista=todos&q=${LOTE_LEJANO}`);
    await otra.getByRole('button', { name: /Ajustar/ }).click();
    await otra.getByRole('dialog').getByLabel('Cantidad nueva').fill('5');
    await otra.getByRole('dialog').getByLabel('Motivo').fill('Conteo físico de prueba');
    await otra.getByRole('dialog').getByRole('button', { name: 'Guardar ajuste' }).click();
    await expect(otra.locator('.aviso').first()).toBeVisible();
    await otra.context().close();

    await page.getByRole('button', { name: 'Revisar y confirmar' }).click();
    await dialogo(page).getByRole('button', { name: 'Confirmar transferencia' }).click();
    await expect(page.getByText(/Disponible: 5 \(pediste 10\)/)).toBeVisible();
    // Nada se descontó: el lote sigue en 5.
    await page.getByRole('button', { name: 'Descartar' }).click();
    await dialogo(page).getByRole('button', { name: 'Descartar' }).click();
    await page.goto(`/lotes?vista=todos&q=${LOTE_LEJANO}`);
    await expect(page.getByRole('row', { name: new RegExp(LOTE_LEJANO) })).toContainText('5');
  });

  test('medicamento: no se da de baja con stock; sí después de ajustar a 0; y se reactiva', async () => {
    await page.goto('/medicamentos');
    await page.getByLabel('Buscar por código o nombre').fill(CODIGO);
    await page.getByRole('link', { name: NOMBRE }).click();
    await expect(page.getByRole('row', { name: /Ingreso/ }).first()).toBeVisible();
    await expect(page.getByRole('row', { name: /Egreso/ }).first()).toBeVisible();
    await expect(page.getByRole('row', { name: /Ajuste/ }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Dar de baja' }).click();
    await dialogo(page).getByRole('button', { name: 'Dar de baja' }).click();
    await expect(dialogo(page)).toContainText('todavía tiene stock sin vencer');
    await dialogo(page).getByRole('button', { name: 'Cancelar' }).click();

    await page.goto(`/lotes?vista=todos&q=${LOTE_LEJANO}`);
    await page.getByRole('button', { name: /Ajustar/ }).click();
    await dialogo(page).getByLabel('Cantidad nueva').fill('0');
    await dialogo(page).getByLabel('Motivo').fill('Retiro de prueba');
    await dialogo(page).getByRole('button', { name: 'Guardar ajuste' }).click();
    await expect(page.getByText(/No hay lotes que coincidan/)).toBeVisible();

    await page.goto('/medicamentos');
    await page.getByLabel('Buscar por código o nombre').fill(CODIGO);
    await page.getByRole('link', { name: NOMBRE }).click();
    await page.getByRole('button', { name: 'Dar de baja' }).click();
    await dialogo(page).getByRole('button', { name: 'Dar de baja' }).click();
    await aviso(page, `Se dio de baja ${NOMBRE}`);
    await page.getByRole('button', { name: 'Reactivar' }).click();
    await dialogo(page).getByRole('button', { name: 'Reactivar' }).click();
    await aviso(page, `Se reactivó ${NOMBRE}`);
  });

  test('lote vencido: baja por vencimiento con motivo', async () => {
    await page.goto('/lotes?vista=vencidos');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.tabla__esqueleto')).toHaveCount(0);
    const filas = page.getByRole('row', { name: /Vencido/ });
    test.skip((await filas.count()) === 0, 'No hay lotes vencidos en los datos demo.');
    const fila = filas.first();
    const lote = (await fila.getByRole('cell').nth(1).innerText()).trim();
    await fila.getByRole('button', { name: /Dar de baja/ }).click();
    await dialogo(page).getByLabel('Motivo').fill(`Retirado para destrucción, prueba ${S}`);
    await dialogo(page).getByRole('button', { name: 'Dar de baja' }).click();
    await aviso(page, `Se dio de baja el lote ${lote}`);
    await expect(page.getByRole('row', { name: new RegExp(lote) })).toHaveCount(0);
  });

  test('usuarios: crear, editar rol, permisos, contraseña, desactivar y recuperar', async ({ browser }) => {
    await page.goto('/usuarios');
    await page.getByRole('button', { name: 'Nuevo usuario' }).click();
    await dialogo(page).getByLabel('Usuario').fill(USUARIO);
    await dialogo(page).getByLabel('Nombre completo').fill(`Usuario de Prueba ${S}`);
    await dialogo(page).getByLabel('Rol').selectOption('FARMACEUTICO');
    await dialogo(page).getByLabel('Contraseña inicial').fill('clave-prueba-1');
    await dialogo(page).getByLabel('Repetir contraseña').fill('clave-prueba-1');
    await dialogo(page).getByRole('button', { name: 'Guardar' }).click();
    await aviso(page, `Se creó el usuario ${USUARIO}`);

    await page.getByLabel('Buscar por usuario o nombre').fill(USUARIO);
    await page.getByRole('button', { name: `Editar a ${USUARIO}` }).click();
    await dialogo(page).getByLabel('Rol').selectOption('CONSULTA');
    await dialogo(page).getByRole('button', { name: 'Guardar' }).click();
    await aviso(page, `Se actualizó el usuario ${USUARIO}`);

    await page.getByRole('button', { name: `Restablecer contraseña de ${USUARIO}` }).click();
    await dialogo(page)
      .getByLabel(/^Contraseña nueva/)
      .fill('clave-prueba-2');
    await dialogo(page).getByLabel('Repetir contraseña').fill('clave-prueba-2');
    await dialogo(page).getByRole('button', { name: 'Guardar' }).click();
    await aviso(page, `Se restableció la contraseña de ${USUARIO}`);

    // El rol CONSULTA no ve acciones de alta ni pantallas de administración.
    const consulta = await nuevaSesion(browser);
    await ingresar(consulta, USUARIO, 'clave-prueba-2');
    await expect(consulta.getByRole('link', { name: 'Nueva transferencia' })).toHaveCount(0);
    await expect(consulta.getByRole('link', { name: 'Usuarios' })).toHaveCount(0);
    await consulta.goto('/medicamentos');
    await expect(consulta.getByRole('link', { name: 'Nuevo medicamento' })).toHaveCount(0);
    await consulta.goto('/usuarios');
    await expect(
      consulta.getByRole('heading', { name: 'No tenés permiso para ver esta página.' }),
    ).toBeVisible();

    await consulta.goto('/cuenta');
    await consulta.getByLabel('Contraseña actual').fill('clave-equivocada');
    await consulta.getByLabel(/^Contraseña nueva/).fill('clave-prueba-3');
    await consulta.getByLabel('Repetir la contraseña nueva').fill('clave-prueba-3');
    await consulta.getByRole('button', { name: 'Cambiar la contraseña' }).click();
    await expect(consulta.getByText('La contraseña actual no es correcta.')).toBeVisible();
    await consulta.getByLabel('Contraseña actual').fill('clave-prueba-2');
    await consulta.getByRole('button', { name: 'Cambiar la contraseña' }).click();
    await aviso(consulta, 'Se cambió tu contraseña.');
    await salir(consulta);
    await ingresar(consulta, USUARIO, 'clave-prueba-3');

    // Desactivado: pierde el acceso en su próxima acción, aunque tenga la sesión abierta.
    await page.getByRole('button', { name: `Desactivar a ${USUARIO}` }).click();
    await dialogo(page).getByRole('button', { name: 'Desactivar' }).click();
    await aviso(page, `Se desactivó el usuario ${USUARIO}`);
    await consulta.goto('/medicamentos');
    await expect(consulta.getByRole('heading', { name: 'Ingresar' })).toBeVisible();
    await consulta.getByLabel('Usuario').fill(USUARIO);
    await consulta.getByLabel('Contraseña').fill('clave-prueba-3');
    await consulta.getByRole('button', { name: 'Ingresar' }).click();
    await expect(consulta.getByText('Usuario o contraseña incorrectos.')).toBeVisible();

    await page.getByLabel('Incluir inactivos').check();
    await page.getByRole('button', { name: `Activar a ${USUARIO}` }).click();
    await dialogo(page).getByRole('button', { name: 'Activar' }).click();
    await aviso(page, `Se activó el usuario ${USUARIO}`);

    // Recuperación de contraseña (en el perfil demo el código se muestra en pantalla).
    await consulta.goto('/recuperar');
    await consulta.getByLabel('Usuario').fill(USUARIO);
    await consulta.getByRole('button', { name: 'Enviar el código' }).click();
    const codigo = (await consulta.locator('.ingreso__codigo strong').innerText()).trim();
    expect(codigo).toMatch(/^\d{6}$/);
    await consulta.getByLabel('Código').fill(codigo === '000000' ? '111111' : '000000');
    await consulta.getByLabel(/^Contraseña nueva/).fill('clave-prueba-4');
    await consulta.getByLabel('Repetir la contraseña nueva').fill('clave-prueba-4');
    await consulta.getByRole('button', { name: 'Crear la contraseña nueva' }).click();
    await expect(consulta.getByText(/código/i).last()).toBeVisible();
    await consulta.getByLabel('Código').fill(codigo);
    await consulta.getByRole('button', { name: 'Crear la contraseña nueva' }).click();
    await expect(consulta.getByText('Listo, ya podés ingresar con tu contraseña nueva.')).toBeVisible();
    await ingresar(consulta, USUARIO, 'clave-prueba-4');
    await consulta.context().close();
  });

  test('nadie puede desactivarse a sí mismo', async () => {
    await page.goto('/usuarios');
    await page.getByLabel('Buscar por usuario o nombre').fill(ADMIN);
    await expect(page.getByRole('row', { name: new RegExp(`^${ADMIN}`) }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: `Desactivar a ${ADMIN}` })).toHaveCount(0);
  });
});

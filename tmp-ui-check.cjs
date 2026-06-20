const { chromium } = require('C:/Users/nicou/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  const perfumePosts = [];
  page.on('console', (message) => console.log(`[browser:${message.type()}] ${message.text()}`));
  page.on('pageerror', (error) => console.error('[pageerror]', error));

  await page.route('**/api/perfumes', async (route) => {
    if (route.request().method() === 'POST') {
      perfumePosts.push(route.request().postData() || '');
    }
    await route.continue();
  });

  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /agregar producto manual/i }).click();
  const dialog = page.getByRole('dialog');

  const checkbox = dialog.getByRole('checkbox', { name: /guardar/i });
  if (await checkbox.isChecked()) {
    throw new Error('El checkbox de guardar en DB aparece marcado por defecto.');
  }

  await dialog.getByPlaceholder('Ej: Chanel').fill('TEST MARCA');
  await dialog.getByPlaceholder('Ej: Bleu de Chanel').fill('TEST PERFUME MANUAL');
  await dialog.getByPlaceholder('Ej: 65,50').fill('12,50');
  await dialog.getByPlaceholder('Ej: 130000').fill('25000');
  await dialog.getByRole('button', { name: /agregar al carrito/i }).click();
  await page.waitForTimeout(1000);
  console.log(await page.locator('body').innerText());

  await page.getByText('TEST MARCA').last().waitFor({ state: 'visible' });
  await page.getByText('TEST PERFUME MANUAL').last().waitFor({ state: 'visible' });

  if (perfumePosts.length > 0) {
    throw new Error(`Se hizo POST a /api/perfumes: ${perfumePosts.join('\n')}`);
  }

  await browser.close();
  console.log('OK: producto manual agregado al carrito sin POST a /api/perfumes.');
})().catch(async (error) => {
  console.error(error);
  process.exit(1);
});

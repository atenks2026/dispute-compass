/** Debug: does clicking #chk-PROOF_OF_DELIVERY actually tick & raise score to 44? */
import { chromium } from 'playwright-core';

const BASE = 'http://127.0.0.1:3100';
const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));

const browser = await chromium.launch({
  headless: true,
  executablePath: '/home/z/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('.ag-root-wrapper', { timeout: 60000 });
await page.locator('.ag-row', { hasText: 'PP-D-27401' }).first().click();
await page.waitForSelector('text=Deadline Engine', { timeout: 60000 });
await page.getByRole('tab', { name: 'Evidence & Strength' }).click();
await page.waitForSelector('#chk-PROOF_OF_DELIVERY', { timeout: 30000 });

const input = page.locator('#chk-PROOF_OF_DELIVERY');
console.log('tag:', await input.evaluate((el) => el.tagName));
console.log('disabled before:', await input.isDisabled());
console.log('checked before:', await input.isChecked());

await input.click();
for (const t of [0.5, 1, 2, 3, 4, 5]) {
  await sleep(t === 0.5 ? 0.5 : 0.5);
  console.log(`t=${t}s checked=${await input.isChecked()} score_text=${await page.locator('text=/\\d+\\/100/').first().textContent().catch(() => 'n/a')}`);
}
console.log('checkbox html:', (await input.evaluate((el) => el.outerHTML)).slice(0, 300));
await browser.close();

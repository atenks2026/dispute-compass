/**
 * Dispute Compass — Devpost screenshot capture (P4).
 * Runs the production build on localhost:3100 and captures 9 PNGs
 * into download/screenshots/ at 1440x900 (2x DPI).
 * Selectors mirror scripts/record-demo.mjs (proven against the real UI).
 */
import { chromium } from 'playwright-core';
import fs from 'fs';

const BASE = 'http://127.0.0.1:3100';
const OUT = '/home/z/my-project/download/screenshots';
fs.mkdirSync(OUT, { recursive: true });

const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));

const browser = await chromium.launch({
  headless: true,
  executablePath: '/home/z/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-color-profile=srgb', '--hide-scrollbars'],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();
const shot = async (name) => {
  await sleep(0.6);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`[shot] ${name}.png`);
};

console.log('[boot] opening app...');
await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('.ag-root-wrapper', { timeout: 60000 });
await page.waitForSelector('text=Deadline Engine', { timeout: 60000 });
await page.waitForSelector('text=Settlement Advisor', { timeout: 60000 });
console.log('[ready] app loaded');

const row = (id) => page.locator('.ag-row', { hasText: id }).first();

// ---- 01 · Full cockpit: header + KPI strip + AG Grid portfolio ----
await row('PP-D-27401').click();
await page.waitForSelector('text=Deadline Engine', { timeout: 60000 });
await page.mouse.wheel(0, -3000);
await sleep(1.0);
await shot('01-cockpit-dashboard');

// ---- 02 · Deadline Engine card for 27401 (element shot of the card itself) ----
const deHeading = page.getByText('Deadline Engine').first();
let deCard = deHeading.locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');
if ((await deCard.count()) === 0) deCard = deHeading.locator('xpath=ancestor::div[2]');
await deCard.scrollIntoViewIfNeeded();
await sleep(0.6);
await deCard.screenshot({ path: `${OUT}/02-deadline-card-27401.png` });
console.log('[shot] 02-deadline-card-27401.png (element shot)');

// ---- 03 · Evidence & Strength: 24/100 WEAK before POD tick ----
await page.getByRole('tab', { name: 'Evidence & Strength' }).click();
await page.waitForSelector('#chk-PROOF_OF_DELIVERY', { timeout: 30000 });
await page.locator('#chk-PROOF_OF_DELIVERY').scrollIntoViewIfNeeded();
await sleep(1.2);
await shot('03-strength-weak-24');

// ---- 04 · After POD tick: 44/100 MODERATE + Settlement Advisor 45% ----
await page.locator('#chk-PROOF_OF_DELIVERY').click();
await page.waitForSelector('text=/Evidence strength 44\\/100/', { timeout: 20000 });
console.log('[ok] settlement updated to 44/100');
const offerTxt = await page.locator('text=/~45% refund/').first().textContent().catch(() => '(45% offer text not found)');
console.log('[ok] offer text:', offerTxt);
await page.getByText('Settlement Advisor').first().scrollIntoViewIfNeeded();
await sleep(0.8);
await shot('04-strength-44-settlement');

// ---- 05 · AI Case Coach brief (template mode honestly labeled) ----
await page.getByRole('tab', { name: 'AI Case Coach' }).click();
await page.waitForSelector('text=Next best actions', { timeout: 30000 });
await page.locator('text=Next best actions').first().scrollIntoViewIfNeeded();
await sleep(1.0);
await shot('05-ai-case-coach');

// ---- 06 · Letter Studio clean appeal draft (27404) ----
await row('PP-D-27404').click();
await page.waitForSelector('text=Deadline Engine', { timeout: 60000 });
await page.getByRole('tab', { name: 'Letter Studio' }).click();
await page.locator('[aria-label="Document type"]').click();
await page.getByRole('option', { name: 'Appeal after decision' }).click();
await page.fill('#letter-context', 'Carrier trace CARRIER-TRACE-88: parcel confirmed lost in transit AFTER the decision. Carrier contact: logistics@lumendesk.example.');
await page.locator('button', { hasText: 'Generate draft' }).click();
await page.waitForSelector('#letter-body', { timeout: 30000 });
await sleep(1.5);
await shot('06-letter-studio-appeal');

// ---- 07 · Integrity Guard findings (risky sentence injected) ----
const orig = await page.inputValue('#letter-body');
await page.fill('#letter-body', orig + '\n\nThe buyer never received the parcel, and frankly this borders on fraud.');
await page.waitForSelector('text=Integrity Guard findings', { timeout: 10000 });
await page.getByText('Integrity Guard findings').first().scrollIntoViewIfNeeded();
await sleep(1.0);
await shot('07-integrity-guard-blocked');

// ---- 08 · T&C / Policy Navigator (grounded policy quotes) ----
try {
  await page.getByRole('tab', { name: /navigator/i }).click({ timeout: 5000 });
  await sleep(1.2);
  await shot('08-policy-navigator');
} catch (e) {
  console.log('[warn] navigator tab not found:', e.message.split('\n')[0]);
}

// ---- 09 · /api/health JSON (proof of life for judges) ----
const p2 = await context.newPage();
await p2.goto(`${BASE}/api/health`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await sleep(0.6);
await p2.screenshot({ path: `${OUT}/09-health-api.png` });
console.log('[shot] 09-health-api.png');

await browser.close();
console.log('[done] screenshots written to', OUT);

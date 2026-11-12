/**
 * Dispute Compass — demo video recorder.
 * Drives the real app (production build on localhost:3000) through the
 * 7 scenes of docs/video-script.md and records a 1440x900 WebM.
 * Scene holds are synced to the narration durations in /tmp/video/scenes.json.
 */
import { chromium } from 'playwright-core';
import fs from 'fs';

const SCENES = JSON.parse(fs.readFileSync('/tmp/video/scenes.json', 'utf8'));
const PAD = 1.0;          // breathing room after narration, per scene
const BADGE_SEG = 9.5;    // scene 6 seconds spent on the header badges

const marks = {};
const t0 = Date.now();
const now = () => (Date.now() - t0) / 1000;
const mark = (n) => { marks[n] = Math.round(now() * 1000) / 1000; console.log(`[mark] ${n} @ ${marks[n]}s`); };
const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));
const holdRest = async (scene) => {
  const hold = SCENES[scene] + PAD;
  const elapsed = now() - marks[scene];
  const rest = Math.max(0, hold - elapsed);
  console.log(`[hold] ${scene}: ${rest.toFixed(1)}s more (hold ${hold}s)`);
  await sleep(rest);
};

const browser = await chromium.launch({
  headless: true,
  executablePath: '/home/z/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-color-profile=srgb', '--hide-scrollbars', '--mute-audio'],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  recordVideo: { dir: '/tmp/video', size: { width: 1440, height: 900 } },
});
const page = await context.newPage();
mark('vstart');

await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('.ag-root-wrapper', { timeout: 60000 });
await page.waitForSelector('text=Deadline Engine', { timeout: 60000 });
await page.waitForSelector('text=Settlement Advisor', { timeout: 60000 });
console.log('[ready] app loaded, first case analyzed');

const row = (id) => page.locator('.ag-row', { hasText: id }).first();

// ---------- SCENE 0 · Hook: case PP-D-27401 cockpit ----------
await row('PP-D-27401').click();
await page.waitForSelector('text=Deadline Engine', { timeout: 60000 });
await sleep(0.4);
mark('s0');
await page.getByText('Deadline Engine').first().scrollIntoViewIfNeeded();
await sleep(1.2);
await page.mouse.move(900, 400); await page.mouse.move(880, 420, { steps: 8 });
await holdRest('s0');

// ---------- SCENE 1 · The cockpit: KPI strip + AG Grid portfolio ----------
mark('s1');
await page.mouse.wheel(0, -1200);
await sleep(0.8);
await page.mouse.move(400, 230); await sleep(0.8);   // KPI card 1
await page.mouse.move(700, 230); await sleep(0.8);   // KPI card 2
await page.mouse.move(1000, 230); await sleep(0.8);  // KPI card 3
await page.mouse.move(1300, 230); await sleep(0.8);  // KPI card 4
// hover a few portfolio rows (row hover color)
const rows = page.locator('.ag-row');
const n = Math.min(await rows.count(), 4);
for (let i = 0; i < n; i++) { await rows.nth(i).hover(); await sleep(1.1); }
await holdRest('s1');

// ---------- SCENE 2 · Deadline Engine (27401, flash 27405 URGENT) ----------
mark('s2');
await page.getByText('Deadline Engine').first().scrollIntoViewIfNeeded();
await sleep(2.0);
await page.mouse.move(950, 500, { steps: 6 });
await sleep(2.5);
await row('PP-D-27402').click();               // pre-arbitration: red 2-day respond window (matches story doc)
await page.waitForSelector('text=Deadline Engine', { timeout: 60000 });
await page.getByText('Deadline Engine').first().scrollIntoViewIfNeeded();
await sleep(3.5);
await row('PP-D-27401').click();
await page.waitForSelector('text=Deadline Engine', { timeout: 60000 });
await page.getByText('Deadline Engine').first().scrollIntoViewIfNeeded();
await holdRest('s2');

// ---------- SCENE 3 · Strength Meter toggle 24→44 + Settlement Advisor ----------
mark('s3');
await page.getByRole('tab', { name: 'Evidence & Strength' }).click();
await page.waitForSelector('#chk-PROOF_OF_DELIVERY', { timeout: 30000 });
await page.locator('#chk-PROOF_OF_DELIVERY').scrollIntoViewIfNeeded();
await sleep(3.5);                              // 24/100 WEAK visible
await page.locator('#chk-PROOF_OF_DELIVERY').click();
await sleep(4.5);                              // score climbs to 44 MODERATE
await page.getByText('Settlement Advisor').first().scrollIntoViewIfNeeded();
await page.mouse.move(1000, 350, { steps: 6 });
await holdRest('s3');

// ---------- SCENE 4 · AI Case Coach brief (re-brief after evidence change) ----------
mark('s4');
await page.getByRole('tab', { name: 'AI Case Coach' }).click();
await page.waitForSelector('text=Next best actions', { timeout: 30000 });
await page.locator('text=Next best actions').first().scrollIntoViewIfNeeded();
await sleep(3.5);
await page.locator('button', { hasText: 'Re-brief after evidence changes' }).click();
await page.waitForSelector('text=Next best actions', { timeout: 30000 });
await sleep(4.0);                              // refreshed brief
await page.getByText('Settlement Advisor').first().scrollIntoViewIfNeeded();
await sleep(2.5);                              // offer now ~45%
await holdRest('s4');

// ---------- SCENE 5 · Letter Studio + Integrity Guard on PP-D-27404 ----------
mark('s5');
await row('PP-D-27404').click();
await page.waitForSelector('text=Deadline Engine', { timeout: 60000 });
await page.getByRole('tab', { name: 'Letter Studio' }).click();
await page.locator('[aria-label="Document type"]').click();
await page.getByRole('option', { name: 'Appeal after decision' }).click();
await page.fill('#letter-context', 'Carrier trace CARRIER-TRACE-88: parcel confirmed lost in transit AFTER the decision. Carrier contact: logistics@lumendesk.example.');
await page.locator('button', { hasText: 'Generate draft' }).click();
await page.waitForSelector('#letter-body', { timeout: 30000 });
await sleep(3.0);                              // clean appeal draft + Cites POL-APPEAL-10D
const orig = await page.inputValue('#letter-body');
const risky = orig + '\n\nThe buyer never received the parcel, and frankly this borders on fraud.';
await page.fill('#letter-body', risky);
await page.waitForSelector('text=Integrity Guard findings', { timeout: 10000 });
await sleep(4.0);                              // two findings visible
await page.fill('#letter-body', orig);
await sleep(2.0);                              // findings clear (live re-scan)
for (const i of [0, 1, 2]) { await page.locator(`#att-${i}`).click(); await sleep(0.5); }
await sleep(1.0);
await page.locator('button', { hasText: 'Submit appeal' }).click();
await page.waitForSelector('text=Recorded locally (Demo Mode)', { timeout: 30000 });
await holdRest('s5');

// ---------- SCENE 6 · Header badges, then outro card (added in assembly) ----------
mark('s6');
await page.mouse.wheel(0, -3000);
await sleep(0.8);
await page.locator('text=Demo Mode · no credentials needed').first().scrollIntoViewIfNeeded();
await page.mouse.move(1100, 100); await sleep(2.0);
await page.mouse.move(1250, 100); await sleep(2.0);
await sleep(Math.max(0, BADGE_SEG - (now() - marks.s6)));
mark('s6end');
await holdRest('s6');
mark('end');

await context.close(); // flush video
const raw = await page.video().path().catch(() => null);
fs.writeFileSync('/tmp/video/timestamps.json', JSON.stringify(marks, null, 1));
console.log('[done] raw video:', raw);
console.log('[done] timestamps saved');
await browser.close();

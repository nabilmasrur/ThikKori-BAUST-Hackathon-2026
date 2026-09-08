// End-to-end smoke test against the production build.
// Walks the full demo path: language → panel → customer request → matching →
// booking → provider status updates → QR invoice → payment → completion,
// then checks the admin panel and the Bangla locale render.
//
//   npm run build && node scripts/smoke.mjs

import { createRequire } from 'node:module';
const require_ = createRequire(import.meta.url);
// Playwright may be installed globally in CI sandboxes; resolve either way.
const { chromium } = require_('playwright');
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '../../dist');
const PORT = 4318;
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

// SPA static server: unknown paths fall through to index.html.
const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let file = join(root, url.pathname);
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    const body = await readFile(join(root, 'index.html'));
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(body);
  }
});

const failures = [];
const steps = [];
const check = (name, ok, detail = '') => {
  steps.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(name);
};

await new Promise((r) => server.listen(PORT, r));
const base = `http://localhost:${PORT}`;
const browser = await chromium.launch();

try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  ctx.on('weberror', (e) => errors.push(e.error().message));
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));

  // ── Language screen ──────────────────────────────────────────────
  await page.goto(base, { waitUntil: 'networkidle' });
  check('language screen shown', await page.getByText('Choose your language').isVisible());
  await page.getByRole('button', { name: /English/ }).click();
  await page.waitForURL('**/panels');
  check('routes to panel selection', page.url().endsWith('/panels'));

  // ── Customer: request → match → book ─────────────────────────────
  await page.getByRole('link', { name: /Customer/ }).first().click();
  // Tanjim's saved preference is English, which keeps this run in one locale.
  await page.getByRole('button', { name: /Tanjim Chowdhury/ }).click();
  await page.waitForURL('**/customer');
  check('customer home', await page.getByText(/What needs fixing/).isVisible());

  await page.getByRole('button', { name: /Request a service/ }).first().click();
  await page.getByRole('button', { name: /Plumbing/ }).first().click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.locator('textarea').first().fill('Kitchen sink is blocked and water backs up.');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: /Find technicians/ }).click();
  await page.waitForURL('**/customer/match/**');

  const scoreText = await page.locator('text=/% match/').first().textContent();
  check('match results computed', /\d+% match/.test(scoreText ?? ''), scoreText?.trim());
  check('score breakdown rendered', (await page.locator('text=/contributes \\d+%/').count()) >= 3);

  // Remember who is ranked first — that is who the booking will go to.
  const bookedProvider = (await page.locator('h2.font-display').first().textContent())?.trim();
  check('top-ranked provider identified', Boolean(bookedProvider), bookedProvider);

  await page.getByRole('button', { name: /Book this technician/ }).first().click();
  await page.waitForURL('**/customer/booking/**');
  const bookingUrl = page.url();
  check('booking created', bookingUrl.includes('/customer/booking/'));
  await page.getByText('Status timeline').waitFor();
  check('timeline rendered', (await page.getByText('Requested', { exact: true }).count()) > 0);

  // ── Provider: accept → on the way → in progress → QR ─────────────
  const provider = await ctx.newPage();
  provider.on('pageerror', (e) => errors.push(e.message));
  await provider.goto(`${base}/provider`, { waitUntil: 'networkidle' });
  await provider.getByRole('button', { name: new RegExp(bookedProvider ?? '') }).first().click();
  await provider.waitForURL('**/provider');
  // Providers carry their own language preference; pin this run to English.
  await provider.getByRole('button', { name: 'EN' }).first().click();
  await provider.waitForTimeout(300);
  check('provider dashboard', await provider.getByText(/New requests/).isVisible());

  await provider.getByRole('button', { name: 'Accept', exact: true }).first().click();
  await provider.waitForTimeout(400);
  await provider.getByRole('button', { name: /Start travelling/ }).first().click();
  await provider.waitForTimeout(400);
  await provider.getByRole('button', { name: /Start work/ }).first().click();
  await provider.waitForTimeout(600);
  check('reached in progress', (await provider.getByText('In progress').count()) > 0);

  await provider.getByRole('button', { name: /Show payment QR/ }).first().click();
  await provider.waitForTimeout(300);
  const qrUrl = await provider.locator('.font-mono', { hasText: '/pay/' }).first().textContent();
  check('QR encodes an invoice URL', /\/pay\/[0-9a-f-]{8,}/.test(qrUrl ?? ''), qrUrl?.trim());

  // Realtime: the customer tab should have followed along without a reload.
  await page.waitForTimeout(900);
  check('customer sees live status', (await page.getByText('In progress').count()) > 0);

  // ── Pay page ─────────────────────────────────────────────────────
  const token = (qrUrl ?? '').split('/pay/')[1]?.trim();
  const payer = await ctx.newPage();
  payer.on('pageerror', (e) => errors.push(e.message));
  await payer.goto(`${base}/pay/${token}`, { waitUntil: 'networkidle' });
  check('invoice page opens without login', await payer.getByText('Total due').isVisible());
  await payer.getByRole('button', { name: /bKash/ }).click();
  await payer.getByRole('button', { name: /Confirm payment/ }).click();
  await payer.waitForTimeout(700);
  check('payment confirmed', await payer.getByText(/Payment confirmed/).isVisible());
  check('bilingual confirmation', await payer.getByText('পেমেন্ট নিশ্চিত হয়েছে। ধন্যবাদ!').isVisible());

  // ── Booking auto-completes on both sides ─────────────────────────
  await page.waitForTimeout(900);
  check('booking auto-completed for customer', (await page.getByText('Completed').count()) > 0);
  await provider.waitForTimeout(400);

  // Invalid token
  await payer.goto(`${base}/pay/not-a-real-token`, { waitUntil: 'networkidle' });
  check('invalid token handled', await payer.getByText(/invoice link is invalid/).isVisible());
  // Already-paid token
  await payer.goto(`${base}/pay/${token}`, { waitUntil: 'networkidle' });
  check('already-paid receipt', await payer.getByText(/Already paid/).isVisible());

  // ── Provider finances ────────────────────────────────────────────
  await provider.goto(`${base}/provider/finances`, { waitUntil: 'networkidle' });
  await provider.waitForTimeout(500);
  check('finances net card', await provider.getByText('Net this month').isVisible());
  check('six-month chart drawn', (await provider.locator('svg.recharts-surface').count()) > 0);

  await provider.goto(`${base}/provider/growth`, { waitUntil: 'networkidle' });
  check('tier and challenges', await provider.getByText(/Top providers this week/).isVisible());

  // ── Admin ────────────────────────────────────────────────────────
  const admin = await ctx.newPage();
  admin.on('pageerror', (e) => errors.push(e.message));
  await admin.goto(`${base}/admin`, { waitUntil: 'networkidle' });
  await admin.locator('input[type=email]').fill('admin@thikkori.com.bd');
  await admin.locator('input[type=password]').fill('thikkori-admin-2026');
  await admin.getByRole('button', { name: 'Sign in' }).click();
  await admin.waitForTimeout(500);
  check('admin overview', await admin.getByText('Platform overview').isVisible());

  for (const [path, needle] of [
    ['monitor', 'Request & booking monitor'],
    ['providers', 'Provider management'],
    ['customers', 'Customer management'],
    ['categories', 'Service categories'],
    ['issues', 'Reported issues'],
    ['analytics', 'Platform analytics'],
    ['announcements', 'Announcement broadcast'],
  ]) {
    await admin.goto(`${base}/admin/${path}`, { waitUntil: 'networkidle' });
    await admin.waitForTimeout(250);
    check(`admin/${path}`, await admin.getByText(needle).first().isVisible());
  }

  // ── Bangla ───────────────────────────────────────────────────────
  await page.getByRole('button', { name: 'বাংলা' }).first().click();
  await page.waitForTimeout(400);
  check('bangla locale applied', (await page.locator('html[lang=bn]').count()) === 1);
  const banglaBody = await page.locator('body').innerText();
  check('bengali numerals in amounts', /[০-৯]/.test(banglaBody));
  check('no leftover english labels', !/My bookings/.test(banglaBody));

  // ── 404 (still in Bangla, so assert on the Bangla copy) ──────────
  await page.goto(`${base}/nope`, { waitUntil: 'networkidle' });
  check('404 page', await page.getByText('এই পাতাটি নেই').isVisible());

  check('no uncaught page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
} catch (e) {
  check('smoke run completed', false, e.message);
} finally {
  await browser.close();
  server.close();
}

console.log(steps.join('\n'));
console.log(`\n${steps.length - failures.length}/${steps.length} checks passed`);
process.exit(failures.length ? 1 : 0);

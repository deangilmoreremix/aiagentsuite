// Landing-page smoke test (run against a preview/dev server)
import { chromium } from '@playwright/test';

const BASE = process.env.SMOKE_URL || 'http://localhost:4173';

const results = [];
const errors = [];
function check(name, ok, extra = '') {
  results.push({ name, ok, extra });
  console.log(`${ok ? 'PASS' : 'FAIL'} - ${name}${extra ? ' :: ' + extra : ''}`);
}

const browser = await chromium.launch();
const context = await browser.newContext({
  ignoreHTTPSErrors: process.env.SMOKE_IGNORE_HTTPS === '1',
});
const page = await context.newPage();

page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push('console.error: ' + msg.text());
});
page.on('pageerror', (err) => errors.push('pageerror: ' + err.message));
page.on('requestfailed', (req) => {
  const url = req.url();
  // ignore known external optional integrations
  if (/main\.smartcrm\.vip|supabase|openai|composio|elevenlabs/.test(url)) return;
  errors.push('requestfailed: ' + url + ' ' + (req.failure()?.errorText || ''));
});

try {
  // 1. Homepage HTTP response
  const resp = await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 45000 });
  check('Homepage HTTP 200', resp && resp.status() === 200, `status=${resp && resp.status()}`);

  // 2. Title
  const title = await page.title();
  check('Title is AI Agent Suite', /AI Agent Suite/i.test(title), title);

  // 3. React root renders (has real child content, not blank)
  await page.waitForTimeout(1500);
  const rootText = (await page.locator('#root').innerText().catch(() => ''));
  check('React root has rendered content', rootText.trim().length > 100, `text length=${rootText.trim().length}`);

  // 4. Hero visibility
  const heroVisible = await page.locator('text=/AI Agent|Business Goal|automation|Enterprise/i').first().isVisible().catch(() => false);
  check('Hero heading visible', heroVisible);

  // 5. Main navigation / mode indicator present
  const hasNav = await page.locator('text=/DEMO MODE|LIVE MODE/').first().isVisible().catch(() => false);
  check('Mode indicator present', hasNav);

  // 6. AI console renders
  const hasConsole = await page.locator('text=/AI Agent Console|Agent/i').first().isVisible().catch(() => false);
  check('AI console section present', hasConsole);

  // 7. Goal explorer renders
  const hasGoals = await page.locator('text=/Business Goals|Goal/i').first().isVisible().catch(() => false);
  check('Goal explorer present', hasGoals);

  // 7b. AI console executes a command (exercises the server-proxied demo path:
  //     generateText -> POST /api/llm -> graceful simulated fallback when no
  //     serverless key is configured). Enter submits via the input's handler.
  try {
    const consoleInput = page.locator('input[placeholder*="Demo Mode"], input[placeholder*="Ask anything"]').first();
    if (await consoleInput.count()) {
      const lenBefore = (await page.locator('#root').innerText()).length;
      await consoleInput.fill('Find 3 hot leads and draft follow-up emails');
      await consoleInput.press('Enter');
      await page.waitForTimeout(2500);
      const afterText = (await page.locator('#root').innerText());
      const executed = /hot leads|Simulated response|draft follow-up/i.test(afterText);
      check('AI console executes a command (demo)', executed, afterText.slice(-220).replace(/\n/g, ' '));
    } else {
      check('AI console executes a command (demo)', false, 'input not located');
    }
  } catch (e) {
    check('AI console executes a command (demo)', false, e.message);
  }

  // 8. Navigate to advanced features route
  await page.goto(BASE + '/features-analytics', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(1500);
  const faText = (await page.locator('#root').innerText().catch(() => ''));
  const faNoErrorBoundary = !/failed to load|Advanced Features Error|Page Not Found|went wrong|encountered an error/i.test(faText);
  check('/features-analytics has NO error-boundary fallback', faNoErrorBoundary, faText.slice(0, 80).replace(/\n/g, ' '));
  check('/features-analytics renders content', faText.trim().length > 50, `len=${faText.trim().length}`);
  const faVisible = await page.locator('text=/Features|Analytics|Advanced|Proactive|Learning|Recommend/i').first().isVisible().catch(() => false);
  check('/features-analytics has section heading', faVisible);

  // 8b. Reload deep route directly (host SPA fallback must serve index.html)
  const deepResp = await page.goto(BASE + '/features-analytics', { waitUntil: 'domcontentloaded', timeout: 30000 });
  check('Deep route reload served by host (HTTP 200)', deepResp && deepResp.status() === 200, `status=${deepResp && deepResp.status()}`);

  // 8c. Mobile layout: no major horizontal overflow (regression guard) + hero renders
  try {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check('Mobile: no major horizontal overflow', overflow <= 10, `overflow=${overflow}px`);
    const mHero = await page.locator('text=/AI Agent|Business Goal|automation|Enterprise/i').first().isVisible().catch(() => false);
    check('Mobile: hero renders at 375px', mHero);
  } catch (e) {
    check('Mobile layout check', false, e.message);
  }
} catch (e) {
  check('Smoke test threw', false, e.message);
} finally {
  await browser.close();
}

// 9. No fatal browser exceptions (pageerror / critical console errors)
const fatal = errors.filter((e) => /pageerror:/i.test(e));
check('No fatal page errors', fatal.length === 0, fatal.slice(0, 3).join(' | '));

const undefHooks = errors.filter((e) => /is not defined/i.test(e));
check('No undefined-hook / ReferenceError at runtime', undefHooks.length === 0, undefHooks.slice(0, 2).join(' | '));

const allConsoleErrors = errors.length;
console.log('\n--- captured console/network issues (' + allConsoleErrors + ') ---');
errors.slice(0, 15).forEach((e) => console.log('  ' + e));

const failed = results.filter((r) => !r.ok);
console.log(`\nSUMMARY: ${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);

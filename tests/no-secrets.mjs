// Regression test: assert that no private provider credential can reach the
// public client bundle.
//   1) Source must not reference secret VITE_* provider vars.
//   2) A canary build with FAKE secret env values set must NOT inline them
//      into dist (proves the exposure vector is closed even if the env is set).
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const results = [];
const check = (name, ok, extra = '') => {
  results.push({ name, ok, extra });
  console.log(`${ok ? 'PASS' : 'FAIL'} - ${name}${extra ? ' :: ' + extra : ''}`);
};

const FORBIDDEN_SRC = /VITE_(OPENAI|GEMINI|ELEVENLABS|COMPOSIO)_API_KEY/;

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) acc = walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

// 1) Source scan -----------------------------------------------------------------
const srcFiles = walk('src').filter((f) => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(f));
const srcHits = [];
for (const f of srcFiles) {
  if (FORBIDDEN_SRC.test(readFileSync(f, 'utf8'))) srcHits.push(f);
}
check('No VITE_ provider-secret references in src/', srcHits.length === 0, srcHits.join(', '));

// 2) Canary build ----------------------------------------------------------------
const canary = {
  VITE_OPENAI_API_KEY: 'sk-CANARY_OPENAI_KEY_DO_NOT_SHIP_0001',
  VITE_GEMINI_API_KEY: 'AIzaCANARY_GEMINI_KEY_DO_NOT_SHIP_0002',
  VITE_ELEVENLABS_API_KEY: 'CANARY_ELEVENLABS_KEY_DO_NOT_SHIP_0003',
  VITE_COMPOSIO_API_KEY: 'CANARY_COMPOSIO_KEY_DO_NOT_SHIP_0004',
};
console.log('Building with canary FAKE secrets to prove they are NOT inlined...');
execSync('npx vite build', { stdio: 'inherit', env: { ...process.env, ...canary } });

const distFiles = walk('dist');
const patterns = [/CANARY/g, /sk-[A-Za-z0-9_-]{16,}/g, /AIza[0-9A-Za-z_-]{30,}/g];
const leaked = [];
for (const f of distFiles) {
  const content = readFileSync(f, 'utf8');
  for (const p of patterns) {
    const m = content.match(p);
    if (m) leaked.push(`${f}: ${m.length}x "${p.source}"`);
  }
}
check('No canary/secret patterns in dist bundle', leaked.length === 0, leaked.slice(0, 5).join(' | '));

// 3) No *.map sourcemaps shipped --------------------------------------------------
const maps = distFiles.filter((f) => f.endsWith('.map'));
check('No source maps emitted in dist', maps.length === 0, maps.slice(0, 3).join(', '));

const failed = results.filter((r) => !r.ok);
console.log(`\nNO-SECRETS SUMMARY: ${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);

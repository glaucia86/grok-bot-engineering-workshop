import { chromium } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { startCaptureServer, captureDevice } from './capture-server.mjs';

const cwd = fileURLToPath(new URL('../', import.meta.url));
const root = resolve(cwd, '..');
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const dirty = execFileSync('git', ['status', '--porcelain', '--', 'mvp/src', 'mvp/public/fonts', 'mvp/scripts/capture-cobalt.mjs', 'mvp/e2e/fixtures'], { cwd: root, encoding: 'utf8' }).trim();
if (dirty) throw new Error('Commit runtime and fixture sources before capturing.');
const fixture = JSON.parse(await readFile(join(cwd, 'e2e/fixtures/cobalt-records.json'), 'utf8'));
const records = fixture.records;
const names = [...new Set(records.map(row => row.talkId))];
const summaries = names.map(talkId => {
  const rows = records.filter(row => row.talkId === talkId);
  return { talkId, count: rows.length, average: Math.round(rows.reduce((sum, row) => sum + row.rating, 0) / rows.length * 10) / 10 };
});
function details(name) {
  const rows = records.filter(row => row.talkId.toLowerCase() === name.toLowerCase());
  const distribution = [0,0,0,0,0]; rows.forEach(row => distribution[row.rating - 1]++);
  return { ...summaries.find(talk => talk.talkId.toLowerCase() === name.toLowerCase()), distribution, comments: rows.filter(row => row.comment).reverse().map(row => ({ text: row.comment, date: row.createdAt })) };
}
const out = resolve(process.argv[2] || join(root, 'docs/design/evidence/cobalt-results'));
await mkdir(out, { recursive: true });
let server, browser;
try {
  server = await startCaptureServer({ cwd });
  browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  await page.route('**/api/feedback', route => route.fulfill({ json: summaries }));
  await page.route('**/api/feedback/insights?*', route => route.fulfill({ json: details(new URL(route.request().url()).searchParams.get('talkId')) }));
  const captures = [];
  for (const [width, height] of [[390,844], [768,1024], [1440,1000]]) for (const route of ['/', '/feedback', '/results']) {
    server.assertRunning();
    await page.setViewportSize({ width, height });
    await page.goto(`${server.origin}${route}`);
    await page.getByRole('heading', { level: 1 }).waitFor();
    if (route === '/results') await page.getByRole('list', { name: 'Rating distribution' }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => Promise.all(document.getAnimations().filter(animation => Number.isFinite(animation.effect?.getComputedTiming().iterations)).map(animation => animation.finished.catch(() => {}))));
    const file = `${route === '/' ? 'home' : route.slice(1)}-${width}.png`;
    await page.screenshot({ path: join(out, file), fullPage: true });
    const geometry = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, font: getComputedStyle(document.querySelector('main')).fontFamily }));
    captures.push({ file, route, viewport: [width,height], ...geometry });
    server.assertRunning();
  }
  const files = ['mvp/src/app/globals.css', 'mvp/src/app/loop.css', 'mvp/src/components/feedback-dashboard.css', 'mvp/src/components/feedback-form.css', 'mvp/src/components/feedback-dashboard.tsx', 'mvp/src/components/talk-insights.tsx', 'mvp/src/app/api/feedback/insights/route.ts', 'mvp/e2e/fixtures/cobalt-records.json'];
  const hashes = {};
  for (const file of files) {
    const normalized = (await readFile(join(root, file), 'utf8')).replace(/\r\n/g, '\n');
    const committed = execFileSync('git', ['show', `${revision}:${file}`], { cwd: root, encoding: 'utf8' }).replace(/\r\n/g, '\n');
    if (committed !== normalized) throw new Error(`Runtime file differs from commit: ${file}`);
    hashes[file] = createHash('sha256').update(normalized, 'utf8').digest('hex');
  }
  const assets = execFileSync('git', ['ls-files', 'mvp/public/fonts'], { cwd: root, encoding: 'utf8' }).trim().split(/\r?\n/);
  const fontHashes = {};
  for (const file of assets) fontHashes[file] = createHash('sha256').update(await readFile(join(root, file))).digest('hex');
  await writeFile(join(out, 'manifest.json'), JSON.stringify({ sourceRevision: revision, utc: new Date().toISOString(), scope: fixture.scope, fixtureResponses: records.length, remotePostCount: 0, ownedOrigin: server.origin, ownedPid: server.child.pid, device: captureDevice(browser.version(), await page.evaluate(() => navigator.userAgent)), hashFormat: 'SHA-256 over UTF-8 source normalized CRLF to LF; binary font files hashed as bytes', filesSha256: hashes, fontHashes, captures }, null, 2));
  console.log(JSON.stringify({ sourceRevision: revision, captures: captures.length, overflow: captures.some(c => c.overflow), out }));
} finally { try { await browser?.close(); } finally { await server?.close(); } }

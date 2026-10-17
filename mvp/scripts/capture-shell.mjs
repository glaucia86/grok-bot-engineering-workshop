import { createRequire } from 'node:module';
import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { startCaptureServer, captureDevice } from './capture-server.mjs';
const cwd = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(join(cwd, 'package.json'));
const { chromium } = require('@playwright/test');
const phase = process.argv[2] || 'baseline';
const out = resolve(process.argv[3] || './shell-evidence', phase);
await mkdir(out, {recursive:true});
let server, browser;
try {
 server = await startCaptureServer({ cwd });
 server.assertRunning();
 browser = await chromium.launch();
 const context = await browser.newContext({deviceScaleFactor:1});
 await context.tracing.start({screenshots:true,snapshots:true});
 const page = await context.newPage();
 await page.addInitScript(()=>{window.__perf={longTasks:[],shifts:[]}; new PerformanceObserver(l=>window.__perf.longTasks.push(...l.getEntries().map(e=>({start:e.startTime,duration:e.duration})))).observe({type:'longtask',buffered:true}); new PerformanceObserver(l=>window.__perf.shifts.push(...l.getEntries().filter(e=>!e.hadRecentInput).map(e=>e.value))).observe({type:'layout-shift',buffered:true});});
 await page.route('**/api/feedback',r=>r.fulfill({json:Array.from({length:5},(_,i)=>({talkId:['Engineering reliable bots','Testing feedback','Longer workshop talk about delivery','A11y and interaction','Deployment evidence'][i],average:4.3-i*.4,count:12+i}))}));
 const metrics=[];
 for(const [width,height] of [[390,844],[768,1024],[1440,900]]){
  server.assertRunning();
  await page.setViewportSize({width,height}); await page.goto(server.origin); await page.getByRole('table').waitFor(); await page.waitForTimeout(600);
  await page.screenshot({path:join(out,`${width}x${height}-fixture.png`),fullPage:true});
  server.assertRunning();
  metrics.push(await page.evaluate(()=>({viewport:[innerWidth,innerHeight],url:location.href,overflow:document.documentElement.scrollWidth>innerWidth,firstInputY:document.querySelector('#talkId').getBoundingClientRect().top,perf:window.__perf,resources:performance.getEntriesByType('resource').map(e=>({name:new URL(e.name).pathname,duration:e.duration,transferSize:e.transferSize})),navigation:performance.getEntriesByType('navigation').map(e=>({domContentLoaded:e.domContentLoadedEventEnd,load:e.loadEventEnd}))})));
 }
 await context.tracing.stop({path:join(out,'local-fixture-trace.zip')});
 await writeFile(join(out,'browser-metrics.json'),JSON.stringify({revision:process.env.CAPTURE_SHA,fixture:'five talks; intercepted GET; no persistence or remote requests',device:captureDevice(browser.version(), await page.evaluate(() => navigator.userAgent)), origin:server.origin, ownedPid:server.child.pid,metrics},null,2));
 const files=[];async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())await walk(p);else if(/\.(js|css)$/.test(p)){const b=await readFile(p);files.push({path:relative(cwd,p).replaceAll('\\','/'),bytes:b.length,gzip:gzipSync(b).length});}}}await walk(join(cwd,'.next/static'));
 await writeFile(join(out,'production-assets.json'),JSON.stringify({scope:'all .next/static JS/CSS, same build route set; disk and gzip bytes',total:files.reduce((s,f)=>s+f.bytes,0),gzip:files.reduce((s,f)=>s+f.gzip,0),files},null,2));
 console.log(JSON.stringify(metrics.map(m=>({viewport:m.viewport,firstInputY:m.firstInputY,overflow:m.overflow,longTasks:m.perf.longTasks.length,cls:m.perf.shifts.reduce((a,b)=>a+b,0)}))));
} finally {try {await browser?.close();} finally {await server?.close();}}

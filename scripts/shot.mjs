// 无头截图/交互脚本。用法：
//   node scripts/shot.mjs <url> [w=1920] [h=1080] [dpr=1] <步骤...>
// 步骤（按顺序执行）：click=<css> dbl=<css> rclick=<css> hover=<css> move=x,y down up
//   key=<Key> type=<text> eval=<js> wait=<ms> shot=<输出路径> theme=light|dark clip=x,y,w,h（裁剪后续截图，留空取消） upload=<css>::<文件路径>
import puppeteer from 'puppeteer-core';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const exe = process.env.LNT_BROWSER || 'C:/Program Files/imput/Helium/Application/chrome.exe';
const args = process.argv.slice(2);
const url = args.shift();
const opt = { w: 1920, h: 1080, dpr: 1 };
const steps = [];
let clip;
for (const a of args) {
  const i = a.indexOf('=');
  const k = i < 0 ? a : a.slice(0, i), v = i < 0 ? '' : a.slice(i + 1);
  if (k in opt) opt[k] = +v; else steps.push([k, v]);
}
const profile = path.join(os.tmpdir(), 'lnt-shot-profile');
const browser = await puppeteer.launch({
  executablePath: exe, headless: true, userDataDir: profile,
  args: ['--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--enable-unsafe-webgpu', '--force-device-scale-factor=' + opt.dpr, '--enable-experimental-web-platform-features'],
  defaultViewport: { width: opt.w, height: opt.h, deviceScaleFactor: opt.dpr },
});
const page = await browser.newPage();
const logs = [];
page.on('console', m => { if (['error', 'warn'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', e => logs.push('[pageerror] ' + e.message));
await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
const sleep = ms => new Promise(r => setTimeout(r, ms));
await sleep(600);
for (const [k, v] of steps) {
  try {
    if (k === 'click') await page.click(v);
    else if (k === 'dbl') await page.click(v, { count: 2 });
    else if (k === 'rclick') await page.click(v, { button: 'right' });
    else if (k === 'hover') await page.hover(v);
    else if (k === 'move') { const [x, y] = v.split(',').map(Number); await page.mouse.move(x, y, { steps: 12 }); }
    else if (k === 'down') await page.mouse.down();
    else if (k === 'up') await page.mouse.up();
    else if (k === 'upload') { const [sel, file] = v.split('::'); await (await page.$(sel)).uploadFile(file); }
    else if (k === 'key') await page.keyboard.press(v);
    else if (k === 'type') await page.keyboard.type(v);
    else if (k === 'eval') { const r = await page.evaluate(v); if (r !== undefined) console.log('eval:', typeof r === 'string' ? r : JSON.stringify(r)); }
    else if (k === 'wait') await sleep(+v);
    else if (k === 'theme') await page.evaluate(t => window.__lnt?.sys.setState({ theme: t }), v);
    else if (k === 'clip') { const [x, y, width, height] = v.split(',').map(Number); clip = v ? { x, y, width, height } : undefined; }
    else if (k === 'shot') { fs.mkdirSync(path.dirname(path.resolve(v)), { recursive: true }); await page.screenshot({ path: v, clip, type: v.endsWith('.jpg') ? 'jpeg' : 'png', ...(v.endsWith('.jpg') ? { quality: 90 } : {}) }); console.log('shot', v); }
    else console.log('unknown step', k);
  } catch (e) { console.log(`step ${k}=${v} failed:`, e.message.split('\n')[0]); }
  if (!['wait', 'shot', 'eval', 'clip'].includes(k)) await sleep(350);
}
if (logs.length) console.log(logs.slice(0, 30).join('\n'));
await browser.close();

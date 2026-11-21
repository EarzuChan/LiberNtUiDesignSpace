// 检查英文界面下是否有漏译：依次打开各个界面，扫描页面里残留的中文。
// 用法：先启动 pnpm dev，再运行 node scripts/check-i18n.mjs [baseUrl]
import puppeteer from 'puppeteer-core';
import os from 'node:os';
import path from 'node:path';

const base = process.argv[2] || 'http://127.0.0.1:5173';
const exe = process.env.LNT_BROWSER || 'C:/Program Files/imput/Helium/Application/chrome.exe';
const browser = await puppeteer.launch({
  executablePath: exe, headless: true, userDataDir: path.join(os.tmpdir(), 'lnt-i18n-profile'),
  args: ['--no-first-run', '--no-default-browser-check'], defaultViewport: { width: 1920, height: 1080 },
});
const page = await browser.newPage();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const found = new Map();
// 允许保留的中文：语言名本身、输入法指示、字体示例
const ALLOW = [/^中文（简体）$/, /^中$/, /^中文$/, /Click to switch to 中文/, /^Aa 永 123$/, /^永$/];

async function scan(where) {
  const hits = await page.evaluate(() => {
    const han = /[\u4e00-\u9fff]/, out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) if (han.test(n.nodeValue)) out.push(n.nodeValue.trim().slice(0, 60));
    for (const el of document.querySelectorAll('[placeholder],[title],[alt],[aria-label],[data-tip]'))
      for (const a of ['placeholder', 'title', 'alt', 'aria-label', 'data-tip']) { const v = el.getAttribute(a); if (v && han.test(v)) out.push(`[${a}] ${v.slice(0, 60)}`); }
    for (const el of document.querySelectorAll('input, textarea')) if (han.test(el.value)) out.push(`[value] ${el.value.slice(0, 60)}`);
    return out;
  });
  for (const h of hits) if (!ALLOW.some(re => re.test(h))) found.set(h, where);
}
const run = async (where, fn) => { await page.evaluate(fn); await sleep(700); await scan(where); };

await page.goto(base + '/', { waitUntil: 'networkidle0' });
await page.evaluate(() => { window.__lnt.sys.getState().setLanguage('en'); window.__lnt.wm.getState().wins.forEach(w => window.__lnt.wm.getState().close(w.id)); });
await sleep(800);
await scan('desktop');
for (const f of ['start', 'control', 'calendar']) await run('flyout:' + f, new Function(`window.__lnt.sys.getState().setFlyout('${f}')`));
await run('desktop menu', () => { window.__lnt.sys.getState().setFlyout(null); document.querySelector('.dicons').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 700, clientY: 400 })); });
await page.keyboard.press('Escape');
for (const p of ['system', 'bluetooth', 'network', 'personalization', 'apps', 'accounts', 'time', 'accessibility', 'privacy', 'update', 'about'])
  await run('settings:' + p, new Function(`window.__lnt.wm.getState().launch('settings', { page: '${p}' })`));
await page.evaluate(() => document.querySelectorAll('.srow[aria-expanded="false"]').forEach(e => e.click()));
await run('settings expanders', () => {});
await page.evaluate(() => window.__lnt.wm.getState().wins.forEach(w => window.__lnt.wm.getState().close(w.id)));
for (const p of ['quick', 'pc', 'desktop', 'documents', 'downloads', 'pictures', 'pictures/wallpapers', 'music', 'videos', 'projects', 'trash', 'd'])
  await run('files:' + p, new Function(`(() => { const w = window.__lnt.wm.getState(); w.wins.forEach(x => w.close(x.id)); w.open('files', { path: '${p}' }); })()`));
await page.evaluate(() => { document.querySelector('[data-tip="Details pane"]')?.click(); document.querySelector('.files-status [data-tip="Details"]')?.click(); });
await run('files details', () => {});
await page.evaluate(() => document.querySelector('.fitem')?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 800, clientY: 400 })));
await run('files menu', () => {});
await page.keyboard.press('Escape');
for (const [app, payload] of [['notepad', "{ id: 'desktop/LiberNT 设计规范.md' }"], ['photos', "{ id: 'pictures/优胜美地.webp' }"], ['calculator', 'undefined'], ['terminal', 'undefined'], ['store', 'undefined']])
  await run('app:' + app, new Function(`(() => { const w = window.__lnt.wm.getState(); w.wins.forEach(x => w.close(x.id)); w.open('${app}', ${payload}); })()`));
await run('lock', () => window.__lnt.sys.getState().set({ locked: true }));
await page.evaluate(() => window.__lnt.sys.getState().set({ locked: false }));

await page.goto(base + '/spec.html', { waitUntil: 'networkidle0' });
await sleep(800);
await scan('spec');

if (found.size) { console.log(`${found.size} untranslated string(s):`); for (const [s, w] of found) console.log(`  [${w}] ${s}`); }
else console.log('OK: no untranslated Chinese found in the English UI');
await browser.close();
process.exit(found.size ? 1 : 0);

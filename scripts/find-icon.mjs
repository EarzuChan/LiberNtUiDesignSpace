import fs from 'node:fs';
const dir = 'node_modules/@fluentui/react-icons/lib/atoms/headless-svg';
const all = fs.readdirSync(dir).filter(f => f.endsWith('.js')).map(f => f.slice(0, -3));
for (const q of process.argv.slice(2)) {
  const exact = q.startsWith('=');
  const key = exact ? q.slice(1) : q;
  const hits = all.filter(g => exact ? g === key : g.includes(key));
  const out = hits.slice(0, 40).map(g => {
    const src = fs.readFileSync(`${dir}/${g}.js`, 'utf8');
    const names = [...src.matchAll(/export const (\w+)/g)].map(m => m[1]);
    const sizes = [...new Set(names.map(n => (n.match(/(\d+)(Regular|Filled|Color|Light)$/) || [])[1]).filter(Boolean))].join('/');
    const kinds = [...new Set(names.map(n => (n.match(/(Regular|Filled|Color|Light)$/) || [])[1]))].map(k => k[0]).join('');
    return `${g}[${sizes}|${kinds}]`;
  });
  console.log(q + ': ' + out.join('  ') + (hits.length > 40 ? ` …+${hits.length - 40}` : ''));
}

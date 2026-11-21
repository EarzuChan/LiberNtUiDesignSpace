// 生成 src/styles/palette.css：原子色板（OKLCH）与弹簧缓动曲线。
// 修改下方参数后运行：node scripts/gen-tokens.mjs
import fs from 'node:fs';

const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const L = [0.975, 0.945, 0.895, 0.825, 0.74, 0.65, 0.56, 0.47, 0.38, 0.3, 0.23];
const K = [0.12, 0.25, 0.45, 0.68, 0.88, 1, 1, 0.9, 0.75, 0.6, 0.45];
const hues = {
  red: [25, 0.21], orange: [50, 0.18], amber: [78, 0.16], green: [150, 0.17], teal: [185, 0.12],
  cyan: [220, 0.13], blue: [255, 0.2], indigo: [277, 0.2], violet: [302, 0.2], pink: [352, 0.2],
};
const neutral = { 0: 1, 50: 0.985, 100: 0.965, 150: 0.94, 200: 0.91, 300: 0.85, 400: 0.72, 500: 0.58, 600: 0.46, 700: 0.36, 800: 0.27, 850: 0.235, 900: 0.2, 950: 0.165, 1000: 0.12 };

const f = n => +n.toFixed(4);
let css = '/* 由 scripts/gen-tokens.mjs 生成，请勿手改 */\n:root {\n  /* 中性色：带极轻微的冷调（h=260） */\n';
for (const [k, l] of Object.entries(neutral)) css += `  --neutral-${k}: oklch(${l} ${k == 0 ? 0 : f(0.004 + 0.006 * (1 - Math.abs(l - 0.5) * 2))} 260);\n`;
for (const [name, [h, c]] of Object.entries(hues)) {
  css += `\n  /* ${name} */\n`;
  steps.forEach((s, i) => { css += `  --${name}-${s}: oklch(${L[i]} ${f(c * K[i])} ${h});\n`; });
}

// 弹簧：x(t) = 1 - e^{-ζωt}(cos ωd t + ζω/ωd · sin ωd t)，归一化到 t∈[0,1] 时收敛至 0.1%
function spring(zeta, n = 48) {
  const zw = 6.9, w = zw / zeta, wd = w * Math.sqrt(1 - zeta * zeta);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = i === n ? 1 : 1 - Math.exp(-zw * t) * (Math.cos(wd * t) + (zw / wd) * Math.sin(wd * t));
    pts.push(f(x));
  }
  return `linear(${pts.join(', ')})`;
}
css += `\n  /* 弹簧缓动（配合 --dur-spring-* 使用） */\n`;
css += `  --ease-spring-soft: ${spring(0.8)};\n`;
css += `  --ease-spring: ${spring(0.62)};\n`;
css += `  --ease-spring-bouncy: ${spring(0.45)};\n`;
css += '}\n';
fs.writeFileSync('src/styles/palette.css', css);
console.log('palette.css written', css.length);

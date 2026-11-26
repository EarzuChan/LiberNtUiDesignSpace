// 生成 T0（帧缓冲层）场景用的预烘焙背景：public/lite/backdrop.webp
// T0 没有合成器，不能实时模糊；「模糊」是构建时做一次的静态位图，运行时只需一次 blit。
// 做法：把默认壁纸缩到很小（等价于大半径模糊）→ 平滑放大 → 取亮度映射到固定品牌色相的双色调（T0 不做壁纸取色）
//       → 叠固定噪点抖动，消除暗部色带。
// 修改参数后运行：node scripts/gen-lite.mjs [源壁纸=waterfall-dark]
import sharp from 'sharp';
import fs from 'node:fs';

const src = `public/wallpapers/${process.argv[2] || 'waterfall-dark'}.webp`;
const W = 1920, H = 1080;
const LO = [6, 8, 14]; // 暗部：与 --lite-ground 接近的墨色
const HI = [38, 84, 168]; // 亮部：品牌蓝
const GAMMA = 1.1; // >1 时整体更暗、亮部更集中
const DITHER = 1.5; // 噪点幅度（8 位色阶）

const tiny = await sharp(src).resize(40, 22, { fit: 'cover' }).blur(1.6).toBuffer();
const { data } = await sharp(tiny).resize(W, H, { kernel: 'cubic' }).blur(40).removeAlpha().raw().toBuffer({ resolveWithObject: true });

// 固定种子，保证每次生成的文件一致
let seed = 0x2611;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
for (let i = 0; i < data.length; i += 3) {
  const lum = ((0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255) ** GAMMA;
  const n = (rnd() + rnd() - 1) * DITHER;
  for (let c = 0; c < 3; c++) data[i + c] = Math.max(0, Math.min(255, Math.round(LO[c] + (HI[c] - LO[c]) * lum + n)));
}
fs.mkdirSync('public/lite', { recursive: true });
const out = 'public/lite/backdrop.webp';
await sharp(data, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: 90 }).toFile(out);
console.log(out, fs.statSync(out).size, 'bytes');

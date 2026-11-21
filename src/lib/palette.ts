import { lightnessFor, type AccentColor } from './accents';

/**
 * 从壁纸提取候选强调色。
 * 把图像降采样后逐像素转到 OKLCH，按色相分桶（15° 一桶）；每桶得分 = 像素占比^0.6 × 平均色度，
 * 即「面积够大且够鲜艳」的色相胜出。取得分最高且色相相距 ≥ 40° 的至多 4 个，
 * 色度做上下限约束，明度按色相取亮色模式下的基准值。近乎单色的图像返回低饱和强调色。
 */
export interface WallpaperAnalysis { palette: AccentColor[]; luma: number }

const cache = new Map<string, Promise<WallpaperAnalysis>>();
const BINS = 24;

const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

function oklch(r8: number, g8: number, b8: number): [number, number, number] {
  const r = toLinear(r8 / 255), g = toLinear(g8 / 255), b = toLinear(b8 / 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), (Math.atan2(B, A) * 180) / Math.PI];
}

async function analyze(url: string): Promise<WallpaperAnalysis> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  await img.decode();
  const W = 96, H = Math.max(1, Math.round((96 * img.naturalHeight) / img.naturalWidth));
  const canvas = Object.assign(document.createElement('canvas'), { width: W, height: H });
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, W, H);
  const d = ctx.getImageData(0, 0, W, H).data;

  const bins = Array.from({ length: BINS }, () => ({ n: 0, c: 0, x: 0, y: 0 }));
  let luma = 0, hx = 0, hy = 0;
  const total = W * H;
  for (let i = 0; i < d.length; i += 4) {
    luma += (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
    const [L, C, h] = oklch(d[i], d[i + 1], d[i + 2]);
    const rad = (h * Math.PI) / 180;
    hx += Math.cos(rad) * C; hy += Math.sin(rad) * C;
    // 过暗、过亮或过灰的像素不参与取色
    if (C < 0.035 || L < 0.18 || L > 0.96) continue;
    const b = bins[Math.floor((((h % 360) + 360) % 360) / (360 / BINS)) % BINS];
    b.n++; b.c += C; b.x += Math.cos(rad) * C; b.y += Math.sin(rad) * C;
  }

  const ranked = bins
    .filter(b => b.n / total > 0.012)
    .map(b => ({ h: ((Math.atan2(b.y, b.x) * 180) / Math.PI + 360) % 360, c: b.c / b.n, score: (b.n / total) ** 0.6 * (b.c / b.n) }))
    .sort((a, b) => b.score - a.score);
  const picked: typeof ranked = [];
  for (const r of ranked) {
    if (picked.length >= 4) break;
    if (picked.every(p => Math.abs(((r.h - p.h + 540) % 360) - 180) >= 40)) picked.push(r);
  }
  const round = (a: AccentColor): AccentColor => ({ h: Math.round(a.h), c: +a.c.toFixed(3), l: a.l });
  const palette = picked.map(p => round({ h: p.h, c: Math.min(0.19, Math.max(0.085, p.c * 1.35)), l: lightnessFor(p.h) }));
  if (!palette.length) {
    const h = ((Math.atan2(hy, hx) * 180) / Math.PI + 360) % 360;
    palette.push(round({ h: Number.isFinite(h) ? h : 260, c: 0.03, l: 0.5 }));
  }
  return { palette, luma: luma / total };
}

export function analyzeWallpaper(url: string): Promise<WallpaperAnalysis> {
  let p = cache.get(url);
  if (!p) { p = analyze(url); cache.set(url, p); }
  return p;
}

/**
 * 背景亮度采样器 —— 自适应材质的数据来源。
 *
 * 把壁纸降采样成一张亮度网格；窗口作为「遮挡物」按层级参与合成。
 * 每个注册的材质表面在其矩形内取若干采样点，得到它「背后」的平均亮度（0~1），
 * 写入元素的 --bl。CSS 再据此调节着色明度与不透明度（见 materials.css）。
 */
export type LumaLayer = 'desktop' | 'window' | 'shell';

interface Surface { el: HTMLElement; layer: LumaLayer; z?: () => number; last: number }
interface Occluder { el: HTMLElement; z: () => number; luma: () => number; visible: () => boolean }

const GW = 64, GH = 36;
let grid: Float32Array | null = null;
let imgW = 16, imgH = 9;
let mean = 0.5;
/** 壁纸的契合度与压暗量：决定视口坐标如何映射到图像，以及采样结果的衰减 */
let view: { fit: 'fill' | 'fit' | 'stretch' | 'center' | 'tile'; dim: number } = { fit: 'fill', dim: 0 };
const surfaces = new Set<Surface>();
const occluders = new Set<Occluder>();
let raf = 0;
let wallpaperToken = 0;

function sampleWallpaper(x: number, y: number, vw: number, vh: number): number {
  if (!grid) return 0.5;
  // 把视口坐标映射回图像的归一化坐标 (u, v)；落在图像之外时取垫底的模糊背景亮度
  let u: number, v: number;
  if (view.fit === 'stretch') { u = x / vw; v = y / vh; }
  else if (view.fit === 'tile') { u = (x % imgW) / imgW; v = (y % imgH) / imgH; }
  else {
    const scale = view.fit === 'center' ? 1 : view.fit === 'fit' ? Math.min(vw / imgW, vh / imgH) : Math.max(vw / imgW, vh / imgH);
    u = (x - (vw - imgW * scale) / 2) / (imgW * scale);
    v = (y - (vh - imgH * scale) / 2) / (imgH * scale);
  }
  const k = 1 - view.dim;
  if (u < 0 || u >= 1 || v < 0 || v >= 1) return mean * 0.82 * k;
  return grid[Math.min(GH - 1, (v * GH) | 0) * GW + Math.min(GW - 1, (u * GW) | 0)] * k;
}

function compute() {
  raf = 0;
  const vw = window.innerWidth, vh = window.innerHeight;
  const occ = [...occluders]
    .filter(o => o.visible())
    .map(o => ({ r: o.el.getBoundingClientRect(), z: o.z(), l: o.luma() }))
    .sort((a, b) => b.z - a.z);
  for (const s of surfaces) {
    const r = s.el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const limit = s.layer === 'shell' ? Infinity : s.layer === 'window' ? (s.z?.() ?? 0) : -Infinity;
    const nx = Math.min(10, Math.max(2, Math.round(r.width / 48)));
    const ny = Math.min(10, Math.max(2, Math.round(r.height / 48)));
    let sum = 0;
    for (let j = 0; j < ny; j++) {
      const y = r.top + ((j + 0.5) / ny) * r.height;
      for (let i = 0; i < nx; i++) {
        const x = r.left + ((i + 0.5) / nx) * r.width;
        let l = -1;
        for (const o of occ) {
          if (o.z >= limit) continue;
          if (x >= o.r.left && x <= o.r.right && y >= o.r.top && y <= o.r.bottom) { l = o.l; break; }
        }
        sum += l < 0 ? sampleWallpaper(x, y, vw, vh) : l;
      }
    }
    const v = Math.round((sum / (nx * ny)) * 50) / 50;
    if (v !== s.last) {
      s.last = v;
      s.el.style.setProperty('--bl', String(v));
    }
  }
}

export const luma = {
  invalidate() {
    if (!raf) raf = requestAnimationFrame(compute);
  },
  /** 立即同步计算（用于挂载首帧，避免从默认值过渡） */
  flush() {
    if (raf) cancelAnimationFrame(raf);
    compute();
  },
  register(el: HTMLElement, layer: LumaLayer, z?: () => number) {
    const s: Surface = { el, layer, z, last: -1 };
    surfaces.add(s);
    // 首帧不做过渡
    const prev = el.style.transition;
    el.style.transition = 'none';
    luma.flush();
    requestAnimationFrame(() => { el.style.transition = prev; });
    return () => { surfaces.delete(s); };
  },
  registerOccluder(o: Occluder) {
    occluders.add(o);
    luma.invalidate();
    return () => { occluders.delete(o); luma.invalidate(); };
  },
  async setWallpaper(url: string, opt?: { fit: typeof view.fit; dim: number; w: number; h: number }) {
    const token = ++wallpaperToken;
    const img = new Image();
    img.src = url;
    await img.decode();
    if (token !== wallpaperToken) return;
    const c = document.createElement('canvas');
    c.width = GW; c.height = GH;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, GW, GH);
    const d = ctx.getImageData(0, 0, GW, GH).data;
    const g = new Float32Array(GW * GH);
    for (let i = 0; i < g.length; i++) g[i] = (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255;
    grid = g;
    mean = g.reduce((a, b) => a + b, 0) / g.length;
    imgW = opt?.w ?? img.naturalWidth; imgH = opt?.h ?? img.naturalHeight;
    if (opt) view = { fit: opt.fit, dim: opt.dim };
    luma.invalidate();
  },
  /** 调试/规范页：读取某点的壁纸亮度 */
  at(x: number, y: number) { return sampleWallpaper(x, y, window.innerWidth, window.innerHeight); },
};

if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => luma.invalidate());
  // 兜底：动画结束后的位置变化等
  setInterval(() => luma.invalidate(), 500);
}

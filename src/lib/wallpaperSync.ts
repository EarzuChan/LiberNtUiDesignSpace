import { loadCustomWallpapers } from './customWallpapers';
import { luma } from './luma';
import { analyzeWallpaper } from './palette';
import { activeAccent, useSys } from './system';
import { resolveWallpaper } from './wallpapers';

/** 暗色模式下的壁纸压暗量：平均亮度低于 0.32 不动，越亮压得越多，上限 0.5 */
export const dimFor = (meanLuma: number) => Math.min(0.5, Math.max(0, (meanLuma - 0.32) * 0.9));

let token = 0;
async function sync() {
  const s = useSys.getState();
  const wp = resolveWallpaper(s.wallpaper, s.theme);
  const mine = ++token;
  const { palette, luma: mean } = await analyzeWallpaper(wp.thumb);
  if (mine !== token) return;
  const dim = s.theme === 'dark' && s.dimWallpaper ? +dimFor(mean).toFixed(3) : 0;
  const cur = useSys.getState();
  if (cur.wallpaperFile !== wp.key || cur.wallpaperDim !== dim || JSON.stringify(cur.wallpaperPalette) !== JSON.stringify(palette)) {
    cur.set({ wallpaperFile: wp.key, wallpaperPalette: palette, wallpaperDim: dim });
  }
  luma.setWallpaper(wp.thumb, { fit: s.wallpaperFit, dim, w: wp.w, h: wp.h });
}

/** 壁纸、主题等变化时：重新取色、计算压暗量、更新亮度采样器 */
export function startWallpaperSync() {
  let last = '';
  const check = () => {
    const s = useSys.getState();
    const sig = [s.wallpaper, s.theme, s.wallpaperFit, s.dimWallpaper, s.wallpaperRev].join('|');
    if (sig !== last) { last = sig; void sync(); }
  };
  loadCustomWallpapers().then(() => { useSys.getState().set({ wallpaperRev: useSys.getState().wallpaperRev + 1 }); });
  useSys.subscribe(check);
  check();
}

export { activeAccent };

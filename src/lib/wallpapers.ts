export interface Wallpaper {
  id: string;
  name: string;
  /** 有 dark 时为动态壁纸：随亮/暗模式切换 */
  light: string;
  dark?: string;
  credit: string;
}

const w = (id: string, name: string, credit: string, dynamic = false): Wallpaper => ({
  id,
  name,
  credit,
  light: dynamic ? `${id}-light` : id,
  dark: dynamic ? `${id}-dark` : undefined,
});

export const WALLPAPERS: Wallpaper[] = [
  w('waterfall', '光瀑', 'Krystian Zajdel · KDE · CC BY-SA 4.0', true),
  w('odin', '海蚀拱', 'elementary OS wallpapers', true),
  w('next', '流光', 'Krystian Zajdel · KDE · CC BY-SA 4.0', true),
  w('peak', '雪峰', 'Andy Betts · KDE · CC BY-SA 4.0', true),
  w('nuvole', '云阶', 'KDE · CC BY-SA 4.0', true),
  w('tide', '潮汐', 'Nattu Adnan · elementary OS wallpapers'),
  w('ridges', '雪岭', 'Canazei Granite Ridges · elementary OS wallpapers'),
  w('valley', '山谷', 'elementary OS wallpapers'),
  w('starlight', '星夜', 'elementary OS wallpapers'),
  w('canyon', '峡谷', 'Ashim D’Silva · elementary OS wallpapers'),
  w('fern', '蕨影', 'Morskie Oko · elementary OS wallpapers'),
  w('tower', '晴空', 'Viktor Forgacs · elementary OS wallpapers'),
  w('pier', '栈桥', 'elementary OS wallpapers'),
  w('meadow', '草甸', 'elementary OS wallpapers'),
  w('dunes', '沙丘', 'elementary OS wallpapers'),
  w('petal', '花瓣', 'Martin Adams · elementary OS wallpapers'),
  w('dahlia', '大丽花', 'TJ Holowaychuk · elementary OS wallpapers'),
];

export const wallpaperFile = (wp: Wallpaper, theme: 'light' | 'dark') => (theme === 'dark' && wp.dark ? wp.dark : wp.light);
export const wallpaperUrl = (file: string) => `/wallpapers/${file}.webp`;
export const wallpaperThumb = (file: string) => `/wallpapers/${file}.thumb.webp`;
export const findWallpaper = (id: string) => WALLPAPERS.find(x => x.id === id) ?? WALLPAPERS[0];

/* ---------- 统一解析：内置壁纸与用户上传的壁纸 ---------- */
import { findCustomWallpaper } from './customWallpapers';

export interface ResolvedWallpaper {
  /** 唯一标识当前显示的那张图（动态壁纸的昼/夜两张各不相同） */
  key: string;
  name: string;
  url: string;
  thumb: string;
  /** 原始像素尺寸，用于「居中」「平铺」 */
  w: number;
  h: number;
  custom: boolean;
  dynamic: boolean;
  credit: string;
}

export function resolveWallpaper(id: string, theme: 'light' | 'dark'): ResolvedWallpaper {
  const custom = id.startsWith('custom:') ? findCustomWallpaper(id) : undefined;
  if (custom) return { key: custom.id, name: custom.name, url: custom.url, thumb: custom.thumb, w: custom.w, h: custom.h, custom: true, dynamic: false, credit: '我的图片' };
  const wp = findWallpaper(id);
  const file = wallpaperFile(wp, theme);
  return { key: file, name: wp.name, url: wallpaperUrl(file), thumb: wallpaperThumb(file), w: 3840, h: 2160, custom: false, dynamic: !!wp.dark, credit: wp.credit };
}

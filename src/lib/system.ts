import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { findAccent, inkFor, type AccentColor } from './accents';
import { getLang, setLang, type Lang } from '@/i18n';

export type Theme = 'light' | 'dark';
export type Flyout = 'start' | 'control' | 'calendar' | 'tray' | null;
export type WallpaperFit = 'fill' | 'fit' | 'stretch' | 'center' | 'tile';
/** 表面着色强度：关 / 柔和 / 鲜明 */
export const TINT_LEVELS = [0, 1, 2.5] as const;

export interface SysState {
  /** 界面语言：默认英文，可在托盘的输入法指示器或「时间和语言」里切换 */
  lang: Lang;
  setLanguage: (l: Lang) => void;
  theme: Theme;
  /** 强调色来源：跟随壁纸取色，或使用预设色 */
  accentMode: 'wallpaper' | 'preset';
  accent: string;
  /** 每张壁纸选中的候选色序号（按壁纸文件记忆） */
  accentPick: Record<string, number>;
  tintLevel: 0 | 1 | 2;
  wallpaper: string;
  wallpaperFit: WallpaperFit;
  /** 暗色模式下压暗过亮的壁纸；dimTinted 为带色调的压暗 */
  dimWallpaper: boolean;
  dimTinted: boolean;
  transparency: boolean;
  animations: boolean;
  showWidgets: boolean;
  showDesktopIcons: boolean;
  /** 任务栏样式：悬浮 Dock，或贴底通栏的经典任务栏 */
  taskbarStyle: 'dock' | 'classic';
  dockAlign: 'center' | 'left';
  dockShape: 'pill' | 'rounded';
  brightness: number;
  volume: number;
  muted: boolean;
  wifi: boolean;
  wifiNetwork: string;
  bluetooth: boolean;
  airplane: boolean;
  nightLight: boolean;
  focus: boolean;
  batterySaver: boolean;
  location: boolean;
  userName: string;
  deviceName: string;
  /** 是否已做过首次访问引导（自动打开个性化页） */
  welcomed: boolean;
  /* ---- 以下为运行时状态（flyout、wallpaperRev 不持久化） ---- */
  flyout: Flyout;
  /** 当前壁纸文件及从中提取的候选强调色 */
  wallpaperFile: string;
  wallpaperPalette: AccentColor[];
  /** 当前壁纸的压暗量（0~0.5） */
  wallpaperDim: number;
  /** 自定义壁纸增删后自增，用于触发重渲染 */
  wallpaperRev: number;
  setFlyout: (f: Flyout) => void;
  toggleFlyout: (f: Exclude<Flyout, null>) => void;
  set: (p: Partial<SysState>) => void;
}

const RUNTIME = ['flyout', 'wallpaperRev', 'setFlyout', 'toggleFlyout', 'set', 'setLanguage'] as const;

export const useSys = create<SysState>()(
  persist(
    (set, get) => ({
      lang: getLang(),
      // 先切换翻译层，再更新状态触发重渲染
      setLanguage: l => { setLang(l); set({ lang: l }); },
      theme: 'light',
      accentMode: 'wallpaper',
      accent: 'azure',
      accentPick: {},
      tintLevel: 1,
      wallpaper: 'waterfall',
      wallpaperFit: 'fill',
      dimWallpaper: true,
      dimTinted: false,
      transparency: true,
      animations: true,
      showWidgets: true,
      showDesktopIcons: true,
      taskbarStyle: 'dock',
      dockAlign: 'center',
      dockShape: 'pill',
      brightness: 100,
      volume: 62,
      muted: false,
      wifi: true,
      wifiNetwork: 'LiberNT-5G',
      bluetooth: true,
      airplane: false,
      nightLight: false,
      focus: false,
      batterySaver: false,
      location: true,
      userName: 'Earzu',
      deviceName: 'LIBER-STUDIO',
      welcomed: false,
      flyout: null,
      wallpaperFile: '',
      wallpaperPalette: [],
      wallpaperDim: 0,
      wallpaperRev: 0,
      setFlyout: flyout => set({ flyout }),
      toggleFlyout: f => set({ flyout: get().flyout === f ? null : f }),
      set: p => set(p),
    }),
    {
      name: 'lnt-sys-v1',
      partialize: s => Object.fromEntries(Object.entries(s).filter(([k]) => !(RUNTIME as readonly string[]).includes(k))) as unknown as SysState,
    },
  ),
);

/** 当前生效的强调色：跟随壁纸时取候选色，否则取预设 */
export function activeAccent(s: SysState = useSys.getState()): AccentColor {
  if (s.accentMode === 'wallpaper' && s.wallpaperPalette.length) {
    return s.wallpaperPalette[Math.min(s.accentPick[s.wallpaperFile] ?? 0, s.wallpaperPalette.length - 1)];
  }
  return findAccent(s.accent);
}

/** 任务栏占位高度：悬浮 Dock 含上下留白为 76，经典任务栏为 48 */
export const taskbarHeight = (s: SysState = useSys.getState()) => (s.taskbarStyle === 'classic' ? 48 : 76);

/** 把主题、强调色、着色强度等写到 <html>，CSS token 由此派生 */
export function applySystemToDocument(s: SysState = useSys.getState()) {
  const el = document.documentElement;
  const a = activeAccent(s);
  const ink = inkFor(a);
  el.lang = s.lang === 'zh' ? 'zh-CN' : 'en';
  el.dataset.theme = s.theme;
  el.dataset.transparency = s.transparency ? 'on' : 'off';
  el.dataset.motion = s.animations ? 'on' : 'off';
  el.dataset.taskbar = s.taskbarStyle;
  const vars: Record<string, string | number> = {
    '--accent-h': a.h, '--accent-c': a.c, '--accent-l': a.l,
    '--accent-ink-l': ink.l, '--accent-ink-c': ink.c,
    '--taskbar-h': `${taskbarHeight(s)}px`, '--flyout-gap': s.taskbarStyle === 'classic' ? '12px' : '4px',
    '--tint-h': a.h, '--tint': TINT_LEVELS[s.tintLevel] * Math.min(1, a.c / 0.08),
  };
  for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, String(v));
}

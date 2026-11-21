import { create } from 'zustand';
import { APPS, type AppId } from './apps';
import { taskbarHeight } from './system';

export type SnapZone = 'max' | 'left' | 'right' | 'tl' | 'tr' | 'bl' | 'br';
export interface Rect { x: number; y: number; w: number; h: number }

export interface Win extends Rect {
  id: string;
  app: AppId;
  title: string;
  z: number;
  minimized: boolean;
  snap: SnapZone | null;
  closing: boolean;
  /** 启动参数，例如文件管理器的初始路径 */
  payload?: unknown;
}

interface WmState {
  wins: Win[];
  focused: string | null;
  zTop: number;
  seq: number;
  /** 拖拽贴靠预览 */
  snapPreview: SnapZone | null;
  open: (app: AppId, payload?: unknown, rect?: Partial<Rect>) => string;
  /** 从 Dock/开始菜单启动：单实例或已运行则聚焦 */
  launch: (app: AppId, payload?: unknown) => void;
  dockClick: (app: AppId) => void;
  close: (id: string) => void;
  remove: (id: string) => void;
  focus: (id: string) => void;
  minimize: (id: string) => void;
  toggleMax: (id: string) => void;
  setSnap: (id: string, snap: SnapZone | null) => void;
  setRect: (id: string, r: Partial<Rect>) => void;
  setTitle: (id: string, title: string) => void;
  setSnapPreview: (z: SnapZone | null) => void;
  showDesktop: () => void;
}

export const workArea = (): Rect => ({ x: 0, y: 0, w: window.innerWidth, h: window.innerHeight - taskbarHeight() });

/** 贴靠区域对应的矩形（相对工作区） */
export function zoneRect(zone: SnapZone, wa: Rect = workArea()): Rect {
  const hw = Math.round(wa.w / 2), hh = Math.round(wa.h / 2);
  switch (zone) {
    case 'max': return wa;
    case 'left': return { x: 0, y: 0, w: hw, h: wa.h };
    case 'right': return { x: hw, y: 0, w: wa.w - hw, h: wa.h };
    case 'tl': return { x: 0, y: 0, w: hw, h: hh };
    case 'tr': return { x: hw, y: 0, w: wa.w - hw, h: hh };
    case 'bl': return { x: 0, y: hh, w: hw, h: wa.h - hh };
    case 'br': return { x: hw, y: hh, w: wa.w - hw, h: wa.h - hh };
  }
}
export const winRect = (w: Win): Rect => (w.snap ? zoneRect(w.snap) : { x: w.x, y: w.y, w: w.w, h: w.h });

const topVisible = (wins: Win[], except?: string) =>
  wins.filter(w => !w.minimized && !w.closing && w.id !== except).sort((a, b) => b.z - a.z)[0]?.id ?? null;
const patch = (wins: Win[], id: string, p: Partial<Win>) => wins.map(w => (w.id === id ? { ...w, ...p } : w));

export const useWm = create<WmState>()((set, get) => ({
  wins: [],
  focused: null,
  zTop: 10,
  seq: 0,
  snapPreview: null,
  open(app, payload, rect) {
    const s = get();
    const d = APPS[app];
    const wa = workArea();
    const w = Math.min(rect?.w ?? d.w, wa.w - 24), h = Math.min(rect?.h ?? d.h, wa.h - 24);
    const n = s.wins.filter(x => !x.closing).length;
    const x = rect?.x ?? Math.max(12, Math.round((wa.w - w) / 2) + ((n % 6) - 1) * 32);
    const y = rect?.y ?? Math.max(12, Math.round((wa.h - h) / 2.4) + ((n % 6) - 1) * 28);
    const id = `${app}-${s.seq + 1}`;
    const win: Win = { id, app, title: d.name, x, y, w, h, z: s.zTop + 1, minimized: false, snap: null, closing: false, payload };
    set({ wins: [...s.wins, win], focused: id, zTop: s.zTop + 1, seq: s.seq + 1 });
    return id;
  },
  launch(app, payload) {
    const s = get();
    const existing = s.wins.filter(w => w.app === app && !w.closing).sort((a, b) => b.z - a.z)[0];
    if (existing && (APPS[app].single || payload === undefined)) {
      if (payload !== undefined) set({ wins: patch(s.wins, existing.id, { payload }) });
      get().focus(existing.id);
    }
    else s.open(app, payload);
  },
  dockClick(app) {
    const s = get();
    const mine = s.wins.filter(w => w.app === app && !w.closing).sort((a, b) => b.z - a.z);
    if (!mine.length) return void s.open(app);
    const top = mine[0];
    if (s.focused === top.id && !top.minimized) s.minimize(top.id);
    else s.focus(top.id);
  },
  close(id) {
    const s = get();
    set({ wins: patch(s.wins, id, { closing: true }), focused: s.focused === id ? topVisible(s.wins, id) : s.focused });
  },
  remove: id => set(s => ({ wins: s.wins.filter(w => w.id !== id) })),
  focus(id) {
    const s = get();
    const w = s.wins.find(x => x.id === id);
    if (!w || (s.focused === id && !w.minimized && w.z === s.zTop)) return;
    set({ wins: patch(s.wins, id, { z: s.zTop + 1, minimized: false }), focused: id, zTop: s.zTop + 1 });
  },
  minimize(id) {
    const s = get();
    set({ wins: patch(s.wins, id, { minimized: true }), focused: s.focused === id ? topVisible(s.wins, id) : s.focused });
  },
  toggleMax: id => set(s => ({ wins: s.wins.map(w => (w.id === id ? { ...w, snap: w.snap ? null : 'max' } : w)) })),
  setSnap: (id, snap) => set(s => ({ wins: patch(s.wins, id, { snap }) })),
  setRect: (id, r) => set(s => ({ wins: patch(s.wins, id, r) })),
  setTitle: (id, title) => set(s => (s.wins.find(w => w.id === id)?.title === title ? s : { wins: patch(s.wins, id, { title }) })),
  setSnapPreview: z => { if (get().snapPreview !== z) set({ snapPreview: z }); },
  showDesktop() {
    const s = get();
    const anyVisible = s.wins.some(w => !w.minimized && !w.closing);
    const wins = s.wins.map(w => ({ ...w, minimized: anyVisible }));
    set({ wins, focused: anyVisible ? null : topVisible(wins) });
  },
}));

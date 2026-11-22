import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { APPS, type AppId } from '@/lib/apps';
import { luma } from '@/lib/luma';
import { useSys } from '@/lib/system';
import { useWm, winRect, type Win } from '@/lib/wm';
import { Glass } from '@/ui';
import { Dismiss16Regular } from '@/ui/icons';

const OPEN_DELAY = 400, CLOSE_DELAY = 240, EXIT = 140;
const THUMB_W = 200, THUMB_H = 124, PAD = 12;

export interface Peek { app: AppId; x: number; closing: boolean }
export interface PeekApi {
  /** 指针进入运行中的应用图标 */
  enter: (app: AppId, el: Element) => void;
  /** 指针进入预览本身 */
  keep: () => void;
  /** 指针离开图标或预览 */
  leave: () => void;
  hide: () => void;
}

/** 任务栏窗口预览的开合：悬停片刻才出现；已打开时在图标间移动即时切换；移到预览上不关 */
export function useDockPeek() {
  const [peek, setPeek] = useState<Peek | null>(null);
  const cur = useRef<Peek | null>(null);
  const timer = useRef(0);
  const [api] = useState<PeekApi>(() => {
    const set = (p: Peek | null) => { cur.current = p; setPeek(p); };
    const after = (ms: number, fn: () => void) => { clearTimeout(timer.current); timer.current = window.setTimeout(fn, ms); };
    const show = (app: AppId, el: Element) => {
      if (!el.isConnected) return;
      const r = el.getBoundingClientRect();
      set({ app, x: r.left + r.width / 2, closing: false });
    };
    const api: PeekApi = {
      enter(app, el) {
        clearTimeout(timer.current);
        if (useSys.getState().flyout) return;
        const p = cur.current;
        if (p && !p.closing) { if (p.app !== app) show(app, el); return; }
        if (p) set(null);
        after(OPEN_DELAY, () => show(app, el));
      },
      keep() { if (cur.current && !cur.current.closing) clearTimeout(timer.current); },
      leave() {
        const p = cur.current;
        if (!p) clearTimeout(timer.current);
        else if (p.closing) after(EXIT, () => set(null));
        else after(CLOSE_DELAY, api.hide);
      },
      hide() {
        const p = cur.current;
        if (!p) return void clearTimeout(timer.current);
        if (!p.closing) set({ ...p, closing: true });
        after(EXIT, () => set(null));
      },
    };
    return api;
  });
  const flyout = useSys(s => s.flyout);
  const open = !!peek;
  useEffect(() => { if (flyout) api.hide(); }, [flyout, api]);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === 'Escape' && api.hide();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [open, api]);
  useEffect(() => () => clearTimeout(timer.current), []);
  return { peek, api };
}

/** 一个窗口占面板上的一列：标题行 + 缩略图。缩略图是打开预览那一刻对真实窗口 DOM 的克隆（静态快照） */
function PeekCard({ win, maxW, active, api }: { win: Win; maxW: number; active: boolean; api: PeekApi }) {
  const def = APPS[win.app];
  const box = useRef<HTMLDivElement>(null);
  const r = winRect(win);
  const k = Math.min(maxW / r.w, THUMB_H / r.h);
  const tw = Math.round(r.w * k), th = Math.round(r.h * k);
  useLayoutEffect(() => {
    const host = box.current!;
    const src = document.querySelector<HTMLElement>(`.win[data-win="${win.id}"] .win-frame`);
    if (!src) return;
    const copy = src.cloneNode(true) as HTMLElement;
    copy.inert = true;
    Object.assign(copy.style, { inset: 'auto', left: '0', top: '0', width: `${r.w}px`, height: `${r.h}px`, transform: `scale(${k})`, transformOrigin: '0 0', animation: 'none', transition: 'none', borderRadius: '0', boxShadow: 'none' });
    host.replaceChildren(copy);
    // 克隆不带滚动位置，逐个补上
    const a = src.querySelectorAll('*'), b = copy.querySelectorAll('*');
    a.forEach((el, i) => { if (el.scrollTop || el.scrollLeft) b[i]?.scrollTo(el.scrollLeft, el.scrollTop); });
    return () => host.replaceChildren();
  }, [win.id, r.w, r.h, k]);
  const pick = () => { useWm.getState().focus(win.id); api.hide(); };
  return (
    <div role="button" tabIndex={0} className="peek-card" data-active={active} onClick={pick} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget && pick()}>
      <div className="peek-head" style={{ width: tw }}>
        <img src={def.icon} alt="" />
        <span>{win.title}</span>
        <button type="button" className="peek-x" aria-label="关闭" onClick={e => { e.stopPropagation(); useWm.getState().close(win.id); }}><Dismiss16Regular /></button>
      </div>
      <div ref={box} className="peek-thumb" data-transparency="off" data-theme={def.dark ? 'dark' : undefined} style={{ width: tw, height: th }} />
    </div>
  );
}

export function DockPeek({ peek, api }: { peek: Peek | null; api: PeekApi }) {
  const wins = useWm(s => s.wins);
  const focused = useWm(s => s.focused);
  const ref = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState<number | null>(null);
  const mine = peek ? wins.filter(w => w.app === peek.app && !w.closing) : [];
  const n = mine.length, app = peek?.app, x = peek?.x;
  useLayoutEffect(() => {
    if (x === undefined || !n || !ref.current) return setLeft(null);
    const w = ref.current.offsetWidth;
    setLeft(Math.round(Math.min(window.innerWidth - w - 8, Math.max(8, x - w / 2))));
    luma.invalidate();
  }, [app, x, n]);
  useEffect(() => { if (app && !n) api.hide(); }, [app, n, api]);
  if (!peek || !n) return null;
  // 窗口很多时缩略图等比收窄，保证整排不超出屏幕
  const maxW = Math.min(THUMB_W, Math.floor((window.innerWidth - 16 - PAD * (n + 1)) / n));
  return (
    <Glass ref={ref} thickness="thick" className="peek" data-state={peek.closing ? 'closing' : 'open'} style={{ left: left ?? 0, visibility: left === null ? 'hidden' : undefined }} onPointerEnter={api.keep} onPointerLeave={api.leave} noise>
      {mine.map(w => <PeekCard key={w.id} win={w} maxW={maxW} active={w.id === focused && !w.minimized} api={api} />)}
    </Glass>
  );
}

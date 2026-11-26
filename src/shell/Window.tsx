import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import { useWm, winRect, workArea, type Rect, type SnapZone, type Win } from '@/lib/wm';
import { useSys } from '@/lib/system';
import { luma } from '@/lib/luma';
import { APPS } from '@/lib/apps';
import { Glass } from '@/ui/Glass';
import { Dismiss16Regular, Square16Regular, SquareMultiple16Regular, Subtract16Regular } from '@/ui/icons';

interface WindowApi { id: string; win: Win; active: boolean; maximized: boolean }
const Ctx = createContext<WindowApi | null>(null);
/** 应用内获取所在窗口 */
export const useWindow = () => useContext(Ctx)!;

export function useViewport() {
  const [, set] = useState(0);
  useEffect(() => {
    const on = () => set(n => n + 1);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
}

const INTERACTIVE = 'button, input, textarea, select, a, [data-nodrag], [role="slider"]';
const tr = (r: { x: number; y: number }) => `translate3d(${Math.round(r.x)}px, ${Math.round(r.y)}px, 0)`;
const motion = (ms: number) => (document.documentElement.dataset.motion === 'off' ? 0 : ms);

function detectZone(x: number, y: number): SnapZone | null {
  const wa = workArea(), E = 8, corner = wa.h * 0.22;
  if (x <= E) return y < corner ? 'tl' : y > wa.h - corner ? 'bl' : 'left';
  if (x >= wa.w - E - 1) return y < corner ? 'tr' : y > wa.h - corner ? 'br' : 'right';
  if (y <= E) return 'max';
  return null;
}

const HANDLES = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const;

export function WindowView({ win, children }: { win: Win; children: ReactNode }) {
  const wm = useWm.getState;
  const active = useWm(s => s.focused === win.id);
  useViewport();
  useSys(s => s.taskbarStyle); // 任务栏样式改变时工作区高度变化，贴靠/最大化的窗口需要重排
  const rect = winRect(win);
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const live = useRef<Rect>(rect);
  const busy = useRef(false); // 正在拖拽/缩放
  const prevSnap = useRef(win.snap);
  const skipFlip = useRef(false);
  const [hidden, setHidden] = useState(win.minimized);
  const st = useRef(win);
  st.current = win;

  useEffect(
    () => luma.registerOccluder({
      el: frame.current!,
      z: () => st.current.z,
      luma: () => (useSys.getState().theme === 'dark' || APPS[st.current.app].dark ? 0.17 : 0.95),
      visible: () => !st.current.minimized && !st.current.closing,
    }),
    [],
  );
  useEffect(() => { luma.invalidate(); });

  // 贴靠/最大化/还原：FLIP 过渡
  useLayoutEffect(() => {
    if (prevSnap.current !== win.snap) {
      prevSnap.current = win.snap;
      if (!skipFlip.current) {
        const a = live.current, b = rect;
        root.current!.animate(
          [{ transform: tr(a), width: a.w + 'px', height: a.h + 'px' }, { transform: tr(b), width: b.w + 'px', height: b.h + 'px' }],
          { duration: motion(300), easing: 'cubic-bezier(0.2, 0.85, 0.2, 1)' },
        );
      }
      skipFlip.current = false;
    }
    if (!busy.current) live.current = rect;
  });

  // 最小化/还原：缩入 Dock 图标
  const first = useRef(true);
  useLayoutEffect(() => {
    if (first.current) { first.current = false; return; }
    const el = root.current!, fr = frame.current!;
    const icon = document.querySelector(`[data-dock-app="${win.app}"]`)?.getBoundingClientRect();
    const r = live.current, s = 0.12;
    const tx = icon ? icon.left + icon.width / 2 - (r.w * s) / 2 : r.x + (r.w * (1 - s)) / 2;
    const ty = icon ? icon.top + icon.height / 2 - (r.h * s) / 2 : window.innerHeight;
    const k0 = { transform: `${tr(r)} scale(1)` }, k1 = { transform: `translate3d(${tx}px, ${ty}px, 0) scale(${s})` };
    if (win.minimized) {
      const a = el.animate([k0, k1], { duration: motion(300), easing: 'cubic-bezier(0.5, 0, 0.85, 0.45)', fill: 'forwards' });
      const b = fr.animate([{ opacity: 1 }, { opacity: 1, offset: 0.4 }, { opacity: 0 }], { duration: motion(300), fill: 'forwards' });
      a.onfinish = () => {
        if (st.current.minimized) setHidden(true);
        a.cancel(); b.cancel();
      };
    } else {
      setHidden(false);
      el.animate([k1, k0], { duration: motion(340), easing: 'cubic-bezier(0.1, 0.9, 0.2, 1)' });
      fr.animate([{ opacity: 0 }, { opacity: 1 }], { duration: motion(180), easing: 'ease-out' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [win.minimized]);

  const apply = (r: Rect) => {
    const el = root.current!;
    el.style.transform = tr(r);
    el.style.width = r.w + 'px';
    el.style.height = r.h + 'px';
    live.current = r;
    luma.invalidate();
  };

  const startDrag = (e: RPointerEvent<HTMLDivElement>) => {
    const t = e.target as Element;
    if (e.button !== 0 || !t.closest('[data-drag]') || t.closest(INTERACTIVE)) return;
    const el = root.current!;
    const sx = e.clientX, sy = e.clientY;
    let origin = winRect(st.current);
    let committed = { x: st.current.x, y: st.current.y };
    let moved = false, zone: SnapZone | null = null;
    const pid = e.pointerId;
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (!moved) {
        if (Math.hypot(dx, dy) < 5) return;
        moved = true; busy.current = true;
        el.setPointerCapture(pid);
        el.dataset.dragging = 'true';
        if (st.current.snap) {
          // 从贴靠状态拖出：恢复原尺寸，并保持指针在标题栏上的相对位置
          const w = st.current.w, h = st.current.h;
          const nx = sx - ((sx - origin.x) / origin.w) * w;
          origin = { x: nx, y: origin.y, w, h };
          skipFlip.current = true;
          wm().setSnap(win.id, null);
          wm().setRect(win.id, { x: nx, y: origin.y });
        }
      }
      const wa = workArea();
      const r = { ...origin, x: Math.min(wa.w - 80, Math.max(80 - origin.w, origin.x + dx)), y: Math.min(wa.h - 36, Math.max(0, origin.y + dy)) };
      committed = { x: r.x, y: r.y };
      apply(r);
      zone = detectZone(ev.clientX, ev.clientY);
      wm().setSnapPreview(zone);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      delete el.dataset.dragging;
      if (!moved) return;
      busy.current = false;
      wm().setSnapPreview(null);
      if (zone) wm().setSnap(win.id, zone);
      else wm().setRect(win.id, committed);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  const startResize = (e: RPointerEvent<HTMLDivElement>, dir: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const handle = e.currentTarget;
    const d = APPS[win.app];
    const sx = e.clientX, sy = e.clientY;
    const o = winRect(st.current);
    if (st.current.snap) { skipFlip.current = true; wm().setSnap(win.id, null); wm().setRect(win.id, o); }
    busy.current = true;
    let r = o;
    handle.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      let { x, y, w, h } = o;
      if (dir.includes('e')) w = Math.max(d.minW, o.w + dx);
      if (dir.includes('s')) h = Math.max(d.minH, o.h + dy);
      if (dir.includes('w')) { w = Math.max(d.minW, o.w - dx); x = o.x + o.w - w; }
      if (dir.includes('n')) { h = Math.max(d.minH, Math.min(o.h - dy, o.y + o.h)); y = o.y + o.h - h; }
      r = { x, y, w, h };
      apply(r);
    };
    const up = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', up);
      handle.removeEventListener('pointercancel', up);
      busy.current = false;
      wm().setRect(win.id, r);
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
    handle.addEventListener('pointercancel', up);
  };

  const maximized = win.snap === 'max';
  return (
    <Ctx.Provider value={{ id: win.id, win, active, maximized }}>
      <div
        ref={root}
        className="win"
        data-win={win.id}
        data-app={win.app}
        data-theme={APPS[win.app].dark ? "dark" : undefined}
        data-active={active}
        data-snap={win.snap ?? undefined}
        data-closing={win.closing || undefined}
        data-hidden={hidden || undefined}
        style={{ transform: tr(rect), width: rect.w, height: rect.h, zIndex: win.z }}
        onPointerDownCapture={() => wm().focus(win.id)}
        onPointerDown={startDrag}
        onDoubleClick={e => {
          const t = e.target as Element;
          if (t.closest('[data-drag]') && !t.closest(INTERACTIVE)) wm().toggleMax(win.id);
        }}
      >
        <Glass
          ref={frame}
          thickness="mica"
          layer="window"
          z={() => st.current.z}
          edge={false}
          className="win-frame"
          onAnimationEnd={e => { if (e.animationName === 'win-out') wm().remove(win.id); }}
        >
          {children}
          <i className="win-edge" aria-hidden />
        </Glass>
        {!maximized && HANDLES.map(h => <div key={h} className={`win-rs win-rs-${h}`} onPointerDown={e => startResize(e, h)} />)}
      </div>
    </Ctx.Provider>
  );
}

/** 窗口控制按钮：最小化 / 最大化 / 关闭 */
export function Caption() {
  const { id, maximized, win } = useWindow();
  const wm = useWm.getState();
  return (
    <div className="caption" data-nodrag>
      <button type="button" className="caption-btn" data-tip="最小化" data-tip-side="bottom" onClick={() => wm.minimize(id)}><Subtract16Regular /></button>
      <button type="button" className="caption-btn" data-tip={win.snap ? '向下还原' : '最大化'} data-tip-side="bottom" onClick={() => wm.toggleMax(id)}>
        {maximized ? <SquareMultiple16Regular /> : <Square16Regular />}
      </button>
      <button type="button" className="caption-btn caption-close" data-tip="关闭" data-tip-side="bottom" onClick={() => wm.close(id)}><Dismiss16Regular /></button>
    </div>
  );
}

/** 标准标题栏：图标 + 标题 + 控制按钮。复杂应用可自行用 data-drag 区域 + <Caption /> 组合 */
export function TitleBar({ title, icon, children }: { title?: ReactNode; icon?: string | false; children?: ReactNode }) {
  const { win } = useWindow();
  return (
    <div className="titlebar" data-drag>
      {icon !== false && <img src={icon ?? APPS[win.app].icon} width={16} height={16} alt="" />}
      <span className="titlebar-title ellipsis">{title ?? win.title}</span>
      {children}
      <Caption />
    </div>
  );
}

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { create } from 'zustand';
import { Glass } from './Glass';
import { Checkmark16Regular, ChevronRight16Regular } from './icons';

export type MenuItem =
  | { separator: true }
  | { header: string }
  | { label: string; icon?: ReactNode; hint?: string; checked?: boolean; disabled?: boolean; danger?: boolean; onClick?: () => void; children?: MenuItem[] };

interface MenuRequest { x: number; y: number; items: MenuItem[]; /** 以锚点矩形定位（下拉菜单） */ anchor?: DOMRect; minWidth?: number; placement?: 'below' | 'above' }
const useMenu = create<{ req: MenuRequest | null }>(() => ({ req: null }));

export const openMenu = (req: MenuRequest) => useMenu.setState({ req });
export const closeMenu = () => useMenu.setState({ req: null });
/** 在元素下方弹出下拉菜单 */
export const openMenuAt = (el: Element, items: MenuItem[], opt: Partial<MenuRequest> = {}) => {
  const r = el.getBoundingClientRect();
  openMenu({ x: r.left, y: r.bottom + 4, anchor: r, items, ...opt });
};

function MenuPanel({ items, x, y, anchor, minWidth, placement, parentRect, layer = 'shell' }: MenuRequest & { parentRect?: DOMRect; layer?: 'shell' }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number; ox: string; oy: string } | null>(null);
  const [sub, setSub] = useState<{ index: number; rect: DOMRect } | null>(null);
  const timer = useRef(0);
  const hasIcons = items.some(i => 'label' in i && (i.icon || i.checked !== undefined));

  useLayoutEffect(() => {
    const el = ref.current!;
    const w = el.offsetWidth, h = el.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight;
    let left = x, top = y, ox = '0', oy = '0';
    if (parentRect) {
      left = parentRect.right - 2; top = parentRect.top - 4;
      if (left + w > vw - 8) { left = parentRect.left - w + 2; ox = '100%'; }
    } else if (anchor && placement === 'above') {
      top = anchor.top - h - 4; oy = '100%';
    }
    if (left + w > vw - 8) { left = Math.max(8, (anchor ? anchor.right : x) - w); ox = '100%'; }
    if (top + h > vh - 8) { top = Math.max(8, (anchor ? anchor.top - 4 : y) - h); oy = '100%'; }
    setPos({ left, top, ox, oy });
  }, [x, y, anchor, placement, parentRect]);

  return (
    <>
      <Glass
        ref={ref}
        thickness="thick"
        layer={layer}
        className="menu"
        role="menu"
        style={{ left: pos?.left ?? x, top: pos?.top ?? y, visibility: pos ? 'visible' : 'hidden', minWidth, ['--ox' as string]: pos?.ox, ['--oy' as string]: pos?.oy }}
        onPointerDown={e => e.stopPropagation()}
        onContextMenu={e => e.preventDefault()}
      >
        {items.map((it, i) => {
          if ('separator' in it) return <div key={i} className="menu-sep" />;
          if ('header' in it) return <div key={i} className="menu-header">{it.header}</div>;
          return (
            <button
              key={i}
              type="button"
              role="menuitem"
              className="menu-item"
              aria-disabled={it.disabled}
              data-danger={it.danger}
              data-open={sub?.index === i}
              onPointerEnter={e => {
                clearTimeout(timer.current);
                const rect = e.currentTarget.getBoundingClientRect();
                timer.current = window.setTimeout(() => setSub(it.children ? { index: i, rect } : null), it.children ? 120 : 200);
              }}
              onClick={e => {
                if (it.children) return setSub({ index: i, rect: e.currentTarget.getBoundingClientRect() });
                closeMenu();
                it.onClick?.();
              }}
            >
              {hasIcons && <span className="menu-ic">{it.checked ? <Checkmark16Regular /> : it.icon}</span>}
              <span className="menu-label">{it.label}</span>
              {it.hint && <span className="menu-hint">{it.hint}</span>}
              {it.children && <ChevronRight16Regular style={{ color: 'var(--text-2)' }} />}
            </button>
          );
        })}
      </Glass>
      {sub && (() => {
        const it = items[sub.index];
        return 'children' in it && it.children ? <MenuPanel key={sub.index} items={it.children} x={0} y={0} parentRect={sub.rect} /> : null;
      })()}
    </>
  );
}

/** 全局菜单宿主：每个页面根部挂一个 */
export function MenuHost() {
  const req = useMenu(s => s.req);
  useEffect(() => {
    if (!req) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeMenu();
    window.addEventListener('keydown', onKey);
    window.addEventListener('blur', closeMenu);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('blur', closeMenu); };
  }, [req]);
  if (!req) return null;
  return (
    <div className="menu-layer" onPointerDown={closeMenu} onContextMenu={e => { e.preventDefault(); closeMenu(); }}>
      <MenuPanel key={`${req.x},${req.y}`} {...req} />
    </div>
  );
}

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Glass } from './Glass';
import { Button, cx } from './controls';
import { CheckmarkCircle20Filled, ChevronDown16Regular, ChevronRight16Regular, ChevronRight20Regular, ErrorCircle20Filled, Info20Filled, Warning20Filled } from './icons';

/** 全局提示宿主：任何带 data-tip 的元素悬停后显示提示；data-tip-side 可取 top/bottom。元素位于 data-overlay-theme 区域内时提示使用该主题 */
export function TooltipHost() {
  const [tip, setTip] = useState<{ text: string; rect: DOMRect; side: string; theme?: string } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useEffect(() => {
    let timer = 0;
    let current: Element | null = null;
    const hide = () => { clearTimeout(timer); current = null; setTip(null); setPos(null); };
    const over = (e: PointerEvent) => {
      const el = (e.target as Element).closest?.('[data-tip]');
      if (el === current) return;
      hide();
      if (!el) return;
      current = el;
      timer = window.setTimeout(() => {
        const text = el.getAttribute('data-tip');
        if (text && el.isConnected) setTip({ text, rect: el.getBoundingClientRect(), side: el.getAttribute('data-tip-side') ?? 'top', theme: el.closest('[data-overlay-theme]')?.getAttribute('data-overlay-theme') ?? undefined });
      }, 450);
    };
    document.addEventListener('pointerover', over);
    document.addEventListener('pointerdown', hide, true);
    document.addEventListener('wheel', hide, true);
    return () => { document.removeEventListener('pointerover', over); document.removeEventListener('pointerdown', hide, true); document.removeEventListener('wheel', hide, true); clearTimeout(timer); };
  }, []);
  useLayoutEffect(() => {
    if (!tip || !ref.current) return;
    const w = ref.current.offsetWidth, h = ref.current.offsetHeight;
    const r = tip.rect;
    let top = tip.side === 'bottom' ? r.bottom + 8 : r.top - h - 8;
    if (top < 8) top = r.bottom + 8;
    if (top + h > window.innerHeight - 8) top = r.top - h - 8;
    const left = Math.min(window.innerWidth - w - 8, Math.max(8, r.left + r.width / 2 - w / 2));
    setPos({ left, top });
  }, [tip]);
  if (!tip) return null;
  return createPortal(
    <Glass ref={ref} thickness="thick" className="tooltip" data-theme={tip.theme} style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos ? 'visible' : 'hidden', ['--ty' as string]: tip.side === 'bottom' ? '-4px' : '4px' }}>
      {tip.text}
    </Glass>,
    document.body.querySelector('[data-theme-root]') ?? document.body,
  );
}

/** 模态对话框 */
export function Dialog({ open, title, children, actions, onClose, width }: { open: boolean; title: string; width?: number; children?: ReactNode; actions: { label: string; variant?: 'accent' | 'danger' | 'standard'; onClick?: () => void }[]; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="dialog-smoke" onPointerDown={e => e.target === e.currentTarget && onClose()}>
      <Glass thickness="thick" className="dialog" role="dialog" aria-modal style={width ? { width } : undefined}>
        <div className="dialog-body"><h3>{title}</h3><div>{children}</div></div>
        <div className="dialog-footer">
          {actions.map(a => (
            <Button key={a.label} variant={a.variant ?? 'standard'} onClick={() => { a.onClick?.(); onClose(); }}>{a.label}</Button>
          ))}
        </div>
      </Glass>
    </div>,
    document.body.querySelector('[data-theme-root]') ?? document.body,
  );
}

const severityIcon = { info: <Info20Filled />, success: <CheckmarkCircle20Filled />, caution: <Warning20Filled />, critical: <ErrorCircle20Filled /> };
export function InfoBar({ severity = 'info', title, children, action }: { severity?: keyof typeof severityIcon; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="infobar" data-severity={severity}>
      {severityIcon[severity]}
      <div className="grow"><span className="t-body-strong">{title}</span>{children && <span className="c-2" style={{ marginLeft: 12 }}>{children}</span>}</div>
      {action}
    </div>
  );
}

/** 侧边导航项 */
export function NavItem({ icon, iconActive, label, active, onClick, trailing, className }: { icon?: ReactNode; iconActive?: ReactNode; label: ReactNode; active?: boolean; onClick?: () => void; trailing?: ReactNode; className?: string }) {
  return (
    <button type="button" className={cx('item item-nav', className)} aria-current={active} onClick={onClick}>
      {active && iconActive ? iconActive : icon}
      <span className="item-label">{label}</span>
      {trailing}
    </button>
  );
}

/** 设置行：图标 + 标题/描述 + 右侧控件 */
export function SettingRow({ icon, title, desc, children, onClick, chevron }: { icon?: ReactNode; title: ReactNode; desc?: ReactNode; children?: ReactNode; onClick?: () => void; chevron?: boolean }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className={cx('srow', onClick && 'srow-click')} onClick={onClick} {...(onClick ? { type: 'button' as const } : {})}>
      {icon}
      <div className="srow-text"><div>{title}</div>{desc && <div>{desc}</div>}</div>
      {children}
      {chevron && <ChevronRight16Regular className="c-2" />}
    </Tag>
  );
}

/** 可展开设置行 */
export function Expander({ icon, title, desc, trailing, children, defaultOpen }: { icon?: ReactNode; title: ReactNode; desc?: ReactNode; trailing?: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="expander">
      <div role="button" tabIndex={0} className="srow srow-click" aria-expanded={open} onClick={() => setOpen(!open)} onKeyDown={e => (e.key === "Enter" || e.key === " ") && e.target === e.currentTarget && setOpen(!open)}>
        {icon}
        <div className="srow-text"><div>{title}</div>{desc && <div>{desc}</div>}</div>
        {trailing}
        <ChevronDown16Regular className="srow-chevron" />
      </div>
      <div className="srow-body" data-open={open}><div>{children}</div></div>
    </div>
  );
}

/** 面包屑：最后一级为当前位置（aria-current，不可点）。size="title" 用作页面标题（设置的次级页） */
export function Breadcrumb({ items, onNavigate, size }: { items: string[]; onNavigate?: (index: number) => void; size?: 'title' }) {
  const Sep = size === 'title' ? ChevronRight20Regular : ChevronRight16Regular;
  return (
    <div className={cx('crumbs', size === 'title' && 'crumbs-title')}>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} style={{ display: 'contents' }}>
            {i > 0 && <Sep />}
            <button type="button" className="crumb" aria-current={last ? 'page' : undefined} onClick={() => !last && onNavigate?.(i)}>{it}</button>
          </span>
        );
      })}
    </div>
  );
}

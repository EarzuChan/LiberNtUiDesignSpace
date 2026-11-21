import { useEffect, useState } from 'react';
import { useSys, type Flyout } from '@/lib/system';
import { getLang } from '@/i18n';

/** 当前时间，按给定间隔刷新 */
export function useNow(interval = 10_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), interval);
    return () => clearInterval(t);
  }, [interval]);
  return now;
}

const WEEK = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
export const fmtTime = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
export const fmtDate = (d: Date) => `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
/** 11月21日 星期六 / Saturday, November 21 */
export const fmtDateLong = (d: Date) =>
  getLang() === 'en' ? d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : `${d.getMonth() + 1}月${d.getDate()}日 ${WEEK[d.getDay()]}`;
/** 2026年11月21日 星期六 / Saturday, November 21, 2026 */
export const fmtDateFull = (d: Date) =>
  getLang() === 'en' ? d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : `${d.getFullYear()}年${fmtDateLong(d)}`;
/** 2026年11月 / November 2026 */
export const fmtMonth = (d: Date) =>
  getLang() === 'en' ? d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : `${d.getFullYear()}年${d.getMonth() + 1}月`;
export const weekday = (d: Date) => WEEK[d.getDay()];

/** 系统浮层的开合：点击外部或 Esc 关闭；关闭时保留一小段时间播放退出动画 */
export function useFlyout(name: Exclude<Flyout, null>) {
  const open = useSys(s => s.flyout === name);
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) return setMounted(true);
    const t = setTimeout(() => setMounted(false), 160);
    return () => clearTimeout(t);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      if (!(e.target as Element).closest?.('.flyout, [data-flyout-trigger], .menu-layer, .dialog-smoke')) useSys.getState().setFlyout(null);
    };
    const key = (e: KeyboardEvent) => e.key === 'Escape' && useSys.getState().setFlyout(null);
    document.addEventListener('pointerdown', down, true);
    window.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', down, true); window.removeEventListener('keydown', key); };
  }, [open]);
  return { show: open || mounted, state: open ? 'open' : 'closing' } as const;
}

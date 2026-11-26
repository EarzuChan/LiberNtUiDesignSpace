import { useEffect, useRef, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/tokens.css';
import '@/styles/base.css';
import './lite.css';
import { getLang, setLang, tr } from '@/i18n';
import { Logo } from '@/ui/Logo';

/**
 * T0（帧缓冲层）场景的共享部件。每个场景是一个独立页面：
 *   /boot.html 启动画面 · /bootmenu.html 启动菜单 · /bugcheck.html 蓝屏 · /recovery.html 恢复环境
 * 网址参数：?lang=zh|en 临时指定语言；?flow 让场景播完后自动衔接下一个（直接打开时停在原地，便于审阅）。
 */
export const params = new URLSearchParams(location.search);
export const FLOW = params.has('flow');
export const VERSION = '26.11';
export const BUILD = '26200.1742';

const langParam = params.get('lang');

export function mountLite(title: string, node: ReactNode) {
  if (langParam === 'zh' || langParam === 'en') setLang(langParam);
  document.documentElement.lang = getLang() === 'zh' ? 'zh-CN' : 'en';
  document.title = tr(title);
  // 从往返缓存回到本页时撤掉离场状态，否则整屏保持透明
  addEventListener('pageshow', () => { delete document.documentElement.dataset.leaving; });
  createRoot(document.getElementById('root')!).render(node);
}

/** 整屏淡出到黑，再跳转到下一个场景；hold 为黑屏停留的毫秒数 */
export function go(url: string, hold = 0) {
  document.documentElement.dataset.leaving = 'true';
  const next = langParam && url.includes('.html') ? `${url}${url.includes('?') ? '&' : '?'}lang=${langParam}` : url;
  setTimeout(() => { location.href = next; }, 260 + hold);
}

export function useKeys(on: (e: KeyboardEvent) => void) {
  const ref = useRef(on);
  ref.current = on;
  useEffect(() => {
    const h = (e: KeyboardEvent) => ref.current(e);
    addEventListener('keydown', h);
    return () => removeEventListener('keydown', h);
  }, []);
}

export type KeyHint = [keys: string[], label: string];

export function Screen({ ground, backdrop, title, keys, className, phase, children }: {
  ground?: 'black' | 'stop'; backdrop?: boolean; title?: string; keys?: KeyHint[]; className?: string; phase?: string; children: ReactNode;
}) {
  return (
    <div className={className ? `lite ${className}` : 'lite'} data-ground={ground} data-phase={phase}>
      {backdrop && <img className="lite-bd" src="/lite/backdrop.webp" alt="" />}
      {title && <header className="lite-head"><Logo size={20} /><b>{title}</b><span>{VERSION}</span></header>}
      {children}
      {keys && (
        <footer className="lite-keys">
          {keys.map(([ks, label]) => <span key={label}>{ks.map(k => <kbd key={k}>{k}</kbd>)}<i>{label}</i></span>)}
        </footer>
      )}
    </div>
  );
}

/** 进度条：不传 value 为不确定进度 */
export function Bar({ value }: { value?: number }) {
  return <div className="l-bar" data-indeterminate={value === undefined}><i style={value === undefined ? undefined : { width: `${value}%` }} /></div>;
}

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useSys } from '@/lib/system';

export function Section({ id, title, lead, children }: { id: string; title: string; lead?: ReactNode; children: ReactNode }) {
  return (
    <section className="spec-section" id={id}>
      <h2>{title}</h2>
      {lead && <p className="lead">{lead}</p>}
      {children}
    </section>
  );
}

/** 同一内容在亮/暗两个主题下并排渲染 */
export function Pair({ children, stack = true }: { children: ReactNode; stack?: boolean }) {
  return (
    <div className="pair">
      {(['light', 'dark'] as const).map(t => (
        <div key={t} data-theme={t}>
          <div className="pair-label">{t === 'light' ? '亮色' : '暗色'}</div>
          <div className={stack ? 'pair-stack' : undefined}>{children}</div>
        </div>
      ))}
    </div>
  );
}

let probe: CanvasRenderingContext2D | null = null;
/** 把任意 CSS 颜色转成 #RRGGBB（带透明度时附加百分比） */
export function toHex(color: string): string {
  probe ??= Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true });
  if (!probe) return '';
  // 透明度单独解析，色值按不透明绘制后读取，避免预乘导致的精度损失
  const m = color.match(/\/\s*([\d.]+)(%?)\s*\)$/);
  const alpha = m ? parseFloat(m[1]) / (m[2] ? 100 : 1) : 1;
  probe.fillStyle = '#000';
  probe.fillStyle = m ? color.slice(0, m.index) + ')' : color;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
  return alpha < 1 ? `${hex} · ${Math.round(alpha * 100)}%` : hex;
}

const copy = (text: string) => navigator.clipboard?.writeText(text).catch(() => {});

/** 颜色 token：色块 + 变量名 + 当前主题下的计算值。点击复制 var(--name) */
export function Token({ name, text }: { name: string; text?: boolean }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [value, setValue] = useState('');
  const theme = useSys(s => s.theme);
  const accent = useSys(s => [s.accent, s.accentMode, s.wallpaperFile, s.tintLevel, JSON.stringify(s.accentPick)].join());
  useEffect(() => {
    const raw = getComputedStyle(ref.current!).getPropertyValue(name).trim();
    setValue(toHex(raw));
  }, [name, theme, accent]);
  return (
    <button type="button" className="token" ref={ref} style={{ ['--c' as string]: `var(${name})` }} data-tip="点击复制" onClick={() => copy(`var(${name})`)}>
      {text ? <i className="token-text" style={{ fontStyle: 'normal' }}>字</i> : <i className="token-chip" />}
      <div><b>{name}</b><span>{value}</span></div>
    </button>
  );
}

export function Tokens({ names, text }: { names: string[]; text?: boolean }) {
  return <div className="tokens">{names.map(n => <Token key={n} name={n} text={text} />)}</div>;
}

export const Kv = ({ children }: { children: ReactNode }) => <code className="spec-kv">{children}</code>;

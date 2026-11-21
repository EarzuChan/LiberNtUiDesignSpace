import { useLayoutEffect, useRef, type CSSProperties, type HTMLAttributes, type Ref } from 'react';
import { luma, type LumaLayer } from '@/lib/luma';

export type GlassThickness = 'ultrathin' | 'thin' | 'regular' | 'thick' | 'mica';

export interface GlassProps extends HTMLAttributes<HTMLDivElement> {
  thickness?: GlassThickness;
  /** 所在层：桌面（只看壁纸）、窗口（看壁纸和更低的窗口）、外壳（看全部） */
  layer?: LumaLayer;
  z?: () => number;
  edge?: boolean;
  noise?: boolean;
  /** 不做自适应采样，固定亮度（规范页演示用） */
  fixedLuma?: number;
  ref?: Ref<HTMLDivElement>;
}

/** 自适应玻璃材质容器 */
export function Glass({ thickness = 'regular', layer = 'shell', z, edge = true, noise, fixedLuma, className, style, ref, ...rest }: GlassProps) {
  const inner = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (fixedLuma !== undefined || !inner.current) return;
    return luma.register(inner.current, layer, z);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer, fixedLuma === undefined]);
  const s = fixedLuma !== undefined ? ({ ...style, '--bl': fixedLuma } as CSSProperties) : style;
  return (
    <div
      ref={el => {
        inner.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) ref.current = el;
      }}
      className={`mat mat-${thickness}${edge ? ' mat-edge' : ''}${noise ? ' mat-noise' : ''}${className ? ' ' + className : ''}`}
      style={s}
      {...rest}
    />
  );
}

/**
 * 渐进式模糊：贴在滚动容器的一侧，内容滑入时由清晰渐变为模糊。
 * 原理：叠 N 层 backdrop-filter，模糊半径逐层倍增，每层用渐变蒙版限定在一段带内。
 */
export function ProgressiveBlur({ side = 'top', size = 64, strength = 16, tint, className, style }: { side?: 'top' | 'bottom'; size?: number; strength?: number; tint?: string; className?: string; style?: CSSProperties }) {
  const layers = 5;
  const dir = side === 'top' ? 'to top' : 'to bottom';
  return (
    <div className={`pblur ${className ?? ''}`} style={{ left: 0, right: 0, [side]: 0, height: size, ...style }} aria-hidden>
      {Array.from({ length: layers }, (_, i) => {
        const a = (i / layers) * 100, b = ((i + 1) / layers) * 100, c = ((i + 2) / layers) * 100;
        const mask = `linear-gradient(${dir}, transparent ${a}%, #000 ${b}%, #000 ${Math.min(c, 100)}%${i < layers - 2 ? `, transparent ${Math.min(c + 100 / layers, 100)}%` : ''})`;
        const blur = (strength / 2 ** (layers - 1 - i)).toFixed(2);
        return <i key={i} style={{ backdropFilter: `blur(${blur}px)`, maskImage: mask }} />;
      })}
      {tint && <i style={{ background: `linear-gradient(${dir}, transparent, ${tint})` }} />}
    </div>
  );
}

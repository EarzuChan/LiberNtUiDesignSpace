import type { CSSProperties } from 'react';
import type { WallpaperFit } from '@/lib/system';

const SIZE: Record<WallpaperFit, string> = { fill: 'cover', fit: 'contain', stretch: '100% 100%', center: 'auto', tile: 'auto' };

/**
 * 按契合度绘制一张壁纸。「适应」「居中」留出的空边用图片自身的模糊放大版垫底。
 * scale 用于缩小的预览：把「居中」「平铺」的原始像素尺寸按预览比例缩放。
 */
export function WallpaperLayer({ url, fit, natural, scale = 1, className, style }: { url: string; fit: WallpaperFit; natural?: { w: number; h: number }; scale?: number; className?: string; style?: CSSProperties }) {
  const size = (fit === 'center' || fit === 'tile') && natural ? `${natural.w * scale}px ${natural.h * scale}px` : SIZE[fit];
  const image = `url("${url}")`;
  return (
    <div className={`wp-layer ${className ?? ''}`} style={style}>
      {(fit === 'fit' || fit === 'center') && <i className="wp-layer-back" style={{ backgroundImage: image, filter: `blur(${Math.max(6, 48 * scale)}px) brightness(0.82) saturate(1.2)` }} />}
      <i style={{ backgroundImage: image, backgroundSize: size, backgroundRepeat: fit === 'tile' ? 'repeat' : 'no-repeat', backgroundPosition: fit === 'tile' ? '0 0' : 'center' }} />
    </div>
  );
}

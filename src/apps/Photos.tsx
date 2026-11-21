import { useEffect, useMemo, useState } from 'react';
import { cmpText } from '@/i18n';
import { formatSize, useFs } from '@/lib/fs';
import { useSys } from '@/lib/system';
import { WALLPAPERS } from '@/lib/wallpapers';
import { useWm, type Win } from '@/lib/wm';
import { Caption, useWindow } from '@/shell/Window';
import { Button, Glass } from '@/ui';
import { ArrowRotateClockwise20Regular, ChevronLeft20Regular, ChevronRight20Regular, Delete20Regular, Wallpaper20Regular, ZoomFit20Regular, ZoomIn20Regular, ZoomOut20Regular } from '@/ui/icons';
import './apps.css';

export function Photos({ win }: { win: Win }) {
  const { active } = useWindow();
  const nodes = useFs(s => s.nodes);
  const requested = (win.payload as { id?: string } | undefined)?.id;
  const [id, setId] = useState(requested);
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  useEffect(() => { if (requested) setId(requested); }, [requested, win.payload]);

  const images = useMemo(() => {
    const all = Object.values(nodes).filter(n => n.type === 'image' && n.src && n.parent !== 'trash');
    const parent = id && nodes[id]?.parent;
    const same = all.filter(n => n.parent === parent);
    return (same.length ? same : all).sort((a, b) => cmpText(a.name, b.name));
  }, [nodes, id]);
  const index = Math.max(0, images.findIndex(n => n.id === id));
  const cur = images[index];
  const step = (d: number) => { setId(images[(index + d + images.length) % images.length]?.id); };

  useEffect(() => { setZoom(1); setRot(0); }, [cur?.id]);
  useEffect(() => { useWm.getState().setTitle(win.id, cur ? `${cur.name} - 照片` : '照片'); }, [cur?.name, win.id, cur]);
  useEffect(() => {
    if (!active) return;
    const on = (e: KeyboardEvent) => { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  });

  const setWallpaper = () => {
    const file = cur?.src?.match(/wallpapers\/(.+)\.webp$/)?.[1];
    const wp = WALLPAPERS.find(w => w.light === file || w.dark === file);
    if (wp) useSys.getState().set({ wallpaper: wp.id });
  };

  return (
    <div className="photos">
      <div className="photos-bar chrome-bar" data-drag>
        <img src="/icons/apps/photos.svg" width={18} height={18} alt="" />
        <span className="t-caption ellipsis" style={{ marginLeft: 6, maxWidth: 220 }}>{cur?.name ?? '照片'}</span>
        {cur && <span className="t-caption c-3 tnum" style={{ marginLeft: 8 }}>{index + 1} / {images.length} · {formatSize(cur.size)}</span>}
        <span className="grow" />
        <Button variant="subtle" iconOnly tip="缩小" icon={<ZoomOut20Regular />} onClick={() => setZoom(z => Math.max(0.4, z - 0.2))} />
        <span className="t-caption c-2 tnum" style={{ width: 40, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
        <Button variant="subtle" iconOnly tip="放大" icon={<ZoomIn20Regular />} onClick={() => setZoom(z => Math.min(3, z + 0.2))} />
        <Button variant="subtle" iconOnly tip="适应窗口" icon={<ZoomFit20Regular />} onClick={() => setZoom(1)} />
        <Button variant="subtle" iconOnly tip="旋转" icon={<ArrowRotateClockwise20Regular />} onClick={() => setRot(r => r + 90)} />
        <Button variant="subtle" iconOnly tip="设为桌面壁纸" icon={<Wallpaper20Regular />} onClick={setWallpaper} />
        <Button variant="subtle" iconOnly tip="删除" icon={<Delete20Regular />} onClick={() => { if (cur) { step(1); useFs.getState().remove([cur.id]); } }} />
        <Caption />
      </div>
      <div className="photos-stage" onDoubleClick={() => setZoom(z => (z === 1 ? 2 : 1))}>
        {cur ? <img key={cur.id} src={cur.src} alt={cur.name} style={{ transform: `scale(${zoom}) rotate(${rot}deg)` }} /> : <div className="c-3">没有可显示的图片</div>}
      </div>
      {images.length > 1 && (
        <>
          <Glass thickness="thin" layer="window" className="photos-nav" style={{ left: 16 }} role="button" data-tip="上一张" onClick={() => step(-1)}><ChevronLeft20Regular /></Glass>
          <Glass thickness="thin" layer="window" className="photos-nav" style={{ right: 16 }} role="button" data-tip="下一张" onClick={() => step(1)}><ChevronRight20Regular /></Glass>
          <div className="photos-strip">
            {images.map(n => (
              <button key={n.id} type="button" className="photos-thumb" aria-current={n.id === cur?.id} data-tip={n.name} onClick={() => setId(n.id)}><img src={n.thumb} alt="" loading="lazy" /></button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

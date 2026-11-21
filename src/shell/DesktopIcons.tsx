import { useMemo, useState } from 'react';
import { iconOf, useFs, type FsNode } from '@/lib/fs';
import { openNode } from '@/lib/open';
import { taskbarHeight, useSys } from '@/lib/system';
import { WALLPAPERS } from '@/lib/wallpapers';
import { useWm } from '@/lib/wm';
import { openMenu } from '@/ui';
import {
  ArrowClockwise16Regular, ArrowUpRight12Filled, ArrowSort16Regular, Delete16Regular, Desktop16Regular, FolderAdd16Regular, Grid16Regular, Image16Regular,
  Info16Regular, Open16Regular, PaintBrush16Regular,
} from '@/ui/icons';

const CW = 96, CH = 112, PAD = 12;

export function DesktopIcons() {
  const nodes = useFs(s => s.nodes);
  useSys(s => s.taskbarStyle);
  const items = useMemo(() => [nodes.pc, nodes.trash, ...Object.values(nodes).filter(n => n.parent === 'desktop')], [nodes]);
  const trashFull = useMemo(() => Object.values(nodes).some(n => n.parent === 'trash'), [nodes]);
  const [cells, setCells] = useState<Record<string, [number, number]>>({});
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // 未指定位置的图标按列依次排布
  const pos: Record<string, [number, number]> = {};
  const used = new Set(Object.entries(cells).filter(([id]) => items.some(i => i.id === id)).map(([, c]) => c.join()));
  const rows = Math.max(1, Math.floor((window.innerHeight - taskbarHeight() - PAD) / CH));
  let k = 0;
  for (const it of items) {
    if (cells[it.id]) { pos[it.id] = cells[it.id]; continue; }
    while (used.has([Math.floor(k / rows), k % rows].join())) k++;
    pos[it.id] = [Math.floor(k / rows), k % rows];
    used.add(pos[it.id].join());
  }

  const dragIcon = (e: React.PointerEvent<HTMLButtonElement>, n: FsNode) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (!sel.has(n.id)) setSel(e.ctrlKey ? new Set([...sel, n.id]) : new Set([n.id]));
    const el = e.currentTarget, sx = e.clientX, sy = e.clientY;
    const [c, r] = pos[n.id];
    let moved = false;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (!moved && Math.hypot(dx, dy) < 5) return;
      moved = true;
      el.dataset.dragging = 'true';
      el.style.translate = `${dx}px ${dy}px`;
    };
    const up = (ev: PointerEvent) => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      delete el.dataset.dragging;
      el.style.translate = '';
      if (!moved) return;
      const nc = Math.max(0, Math.round((c * CW + ev.clientX - sx) / CW));
      const nr = Math.min(rows - 1, Math.max(0, Math.round((r * CH + ev.clientY - sy) / CH)));
      const taken = Object.entries(pos).some(([id, p]) => id !== n.id && p[0] === nc && p[1] === nr);
      if (!taken) setCells({ ...pos, [n.id]: [nc, nr] });
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
  };

  const startMarquee = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || e.target !== e.currentTarget) return;
    const el = e.currentTarget, sx = e.clientX, sy = e.clientY;
    setSel(new Set());
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const m = { x: Math.min(sx, ev.clientX), y: Math.min(sy, ev.clientY), w: Math.abs(ev.clientX - sx), h: Math.abs(ev.clientY - sy) };
      setMarquee(m);
      setSel(new Set(items.filter(it => {
        const [c, r] = pos[it.id], x = PAD + c * CW, y = PAD + r * CH;
        return x < m.x + m.w && x + 88 > m.x && y < m.y + m.h && y + 104 > m.y;
      }).map(it => it.id)));
    };
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      setMarquee(null);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
  };

  const desktopMenu = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    const sys = useSys.getState(), wm = useWm.getState();
    const next = WALLPAPERS[(WALLPAPERS.findIndex(w => w.id === sys.wallpaper) + 1) % WALLPAPERS.length];
    openMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          label: '查看', icon: <Grid16Regular />, children: [
            { label: '大图标' }, { label: '中等图标', checked: true }, { label: '小图标' }, { separator: true },
            { label: '显示桌面图标', checked: true, onClick: () => sys.set({ showDesktopIcons: false }) },
            { label: '显示小组件', checked: sys.showWidgets, onClick: () => sys.set({ showWidgets: !sys.showWidgets }) },
          ],
        },
        { label: '排序方式', icon: <ArrowSort16Regular />, children: [{ label: '名称', onClick: () => setCells({}) }, { label: '大小' }, { label: '项目类型' }, { label: '修改日期' }] },
        { label: '刷新', icon: <ArrowClockwise16Regular />, hint: 'F5', onClick: () => setCells({}) },
        { separator: true },
        { label: '新建文件夹', icon: <FolderAdd16Regular />, onClick: () => useFs.getState().createFolder('desktop') },
        { label: '下一张壁纸', icon: <Image16Regular />, onClick: () => sys.set({ wallpaper: next.id }) },
        { separator: true },
        { label: '显示设置', icon: <Desktop16Regular />, onClick: () => wm.launch('settings', { page: 'system' }) },
        { label: '个性化', icon: <PaintBrush16Regular />, onClick: () => wm.launch('settings', { page: 'personalization' }) },
      ],
    });
  };

  const iconMenu = (e: React.MouseEvent, n: FsNode) => {
    e.stopPropagation();
    setSel(new Set([n.id]));
    const system = n.id === 'pc' || n.id === 'trash';
    openMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: '打开', icon: <Open16Regular />, onClick: () => openNode(n) },
        ...(system ? [] : [{ separator: true as const }, { label: '删除', icon: <Delete16Regular />, danger: true, onClick: () => useFs.getState().remove([n.id]) }]),
        { separator: true },
        { label: '属性', icon: <Info16Regular />, hint: 'Alt+Enter' },
      ],
    });
  };

  return (
    <div className="dicons" onPointerDown={startMarquee} onContextMenu={desktopMenu}>
      {items.map(n => (
        <button
          key={n.id}
          type="button"
          className="dicon"
          data-node={n.id}
          aria-selected={sel.has(n.id)}
          style={{ left: PAD + pos[n.id][0] * CW, top: PAD + pos[n.id][1] * CH }}
          onPointerDown={e => dragIcon(e, n)}
          onDoubleClick={() => openNode(n)}
          onContextMenu={e => iconMenu(e, n)}
        >
          <img src={n.id === 'trash' && trashFull ? '/icons/places/trash-full.svg' : iconOf(n)} alt="" />
          {n.href && <i className="dicon-link"><ArrowUpRight12Filled /></i>}
          <span>{n.name}</span>
        </button>
      ))}
      {marquee && <div className="marquee" style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }} />}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { applySystemToDocument, useSys } from '@/lib/system';
import { resolveWallpaper } from '@/lib/wallpapers';
import { luma } from '@/lib/luma';
import { WallpaperLayer } from '@/ui/WallpaperLayer';
import { useWm, zoneRect } from '@/lib/wm';
import { Glass, MenuHost, ProgressiveBlur, TooltipHost } from '@/ui';
import { AppView } from '@/apps';
import { WindowView, useViewport } from './Window';
import { Taskbar } from './Taskbar';
import { DesktopIcons } from './DesktopIcons';
import { Widgets } from './Widgets';
import { StartMenu } from './StartMenu';
import { ControlCenter } from './ControlCenter';
import { CalendarFlyout } from './CalendarFlyout';
import { LoginUI } from '@/loginui/LoginUI';
import './shell.css';
import './flyouts.css';

/** 壁纸层：切换时新图淡入盖在旧图上；暗色模式下叠一层自适应压暗 */
function Wallpaper() {
  const theme = useSys(s => s.theme);
  const id = useSys(s => s.wallpaper);
  const fit = useSys(s => s.wallpaperFit);
  const dim = useSys(s => s.wallpaperDim);
  const tinted = useSys(s => s.dimTinted);
  useSys(s => s.wallpaperRev);
  const seq = useRef(0);
  const wp = { ...resolveWallpaper(id, theme), id, fade: false, uid: 0 };
  const [stack, setStack] = useState([wp]);
  useEffect(() => {
    // 壁纸本身没换、只是亮/暗切换时（动态壁纸的昼/夜两张），新图只淡入不缩放
    setStack(s => (s[s.length - 1].key === wp.key ? s : [...s.filter(x => x.key !== wp.key), { ...wp, fade: s[s.length - 1].id === id, uid: ++seq.current }]));
    const t = setTimeout(() => setStack(s => s.slice(-1)), 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wp.key, wp.url]);
  return (
    <div className="wallpaper">
      {stack.map(w => <WallpaperLayer key={w.uid} url={w.url} fit={fit} natural={w} className={w.fade ? 'wp-fade' : undefined} />)}
      <div className="wallpaper-dim" data-tinted={tinted} style={{ opacity: dim }} />
    </div>
  );
}

function SnapPreview() {
  const zone = useWm(s => s.snapPreview);
  const z = useWm(s => s.zTop);
  useViewport();
  useSys(s => s.taskbarStyle);
  if (!zone) return null;
  const r = zoneRect(zone);
  return <Glass thickness="thin" className="snap-preview" style={{ zIndex: z, left: r.x + 8, top: r.y + 8, width: r.w - 16, height: r.h - 16 }} />;
}

export function Desktop() {
  useSys(s => s.lang); // 语言切换时自根部重渲染
  const brightness = useSys(s => s.brightness);
  const nightLight = useSys(s => s.nightLight);
  const showWidgets = useSys(s => s.showWidgets);
  const showIcons = useSys(s => s.showDesktopIcons);
  const wins = useWm(s => s.wins);

  useEffect(() => {
    applySystemToDocument();
    return useSys.subscribe(s => { applySystemToDocument(s); luma.invalidate(); });
  }, []);

  return (
    <div className="desktop" onContextMenu={e => e.preventDefault()}>
      <Wallpaper />
      <ProgressiveBlur side="bottom" size={132} strength={14} tint="rgb(0 0 0 / 0.14)" className="desktop-foot" />
      {showIcons && <DesktopIcons />}
      {showWidgets && <Widgets />}
      <div className="win-layer">
        <SnapPreview />
        {wins.map(w => (
          <WindowView key={w.id} win={w}><AppView win={w} /></WindowView>
        ))}
      </div>
      <Taskbar />
      <StartMenu />
      <ControlCenter />
      <CalendarFlyout />
      <div className="screen-warm" style={{ opacity: nightLight ? 0.3 : 0 }} />
      <div className="screen-dim" style={{ opacity: ((100 - brightness) / 100) * 0.62 }} />
      <LoginUI embedded />
      <MenuHost />
      <TooltipHost />
    </div>
  );
}

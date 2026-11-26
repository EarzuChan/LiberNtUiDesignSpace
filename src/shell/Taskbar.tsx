import { useEffect, useRef, useState } from 'react';
import { APPS, DOCK_PINNED, type AppId } from '@/lib/apps';
import { useSys } from '@/lib/system';
import { useWm } from '@/lib/wm';
import { Glass, openMenu, openMenuAt, type MenuItem } from '@/ui';
import { Logo } from '@/ui/Logo';
import {
  Battery820Regular, Bluetooth16Regular, CloudSync16Regular, ShieldCheckmark16Regular, BatterySaver20Regular, ChevronUp16Regular, Dismiss16Regular, Search24Regular, Speaker020Regular, Speaker120Regular, Speaker220Regular,
  SpeakerMute20Regular, Wifi120Regular, WifiOff20Regular, Airplane20Regular, WindowNew16Regular, Window16Regular,
} from '@/ui/icons';
import { fmtDate, fmtDateLong, fmtTime, useNow } from './hooks';
import { DockPeek, useDockPeek, type PeekApi } from './DockPeek';

function DockApp({ app, peek }: { app: AppId; peek: PeekApi }) {
  const def = APPS[app];
  const wins = useWm(s => s.wins);
  const focused = useWm(s => s.focused);
  const mine = wins.filter(w => w.app === app && !w.closing);
  const running = mine.length > 0;
  const active = mine.some(w => w.id === focused && !w.minimized);
  const [hop, setHop] = useState(false);
  const was = useRef(running);
  useEffect(() => {
    if (running && !was.current) {
      setHop(true);
      const t = setTimeout(() => setHop(false), 560);
      was.current = running;
      return () => clearTimeout(t);
    }
    was.current = running;
  }, [running]);

  const menu = (e: React.MouseEvent) => {
    e.preventDefault();
    const wm = useWm.getState();
    const r = e.currentTarget.getBoundingClientRect();
    const items: MenuItem[] = [
      { header: def.name },
      ...mine.map<MenuItem>(w => ({ label: w.title, icon: <Window16Regular />, onClick: () => wm.focus(w.id) })),
      ...(mine.length ? [{ separator: true } as MenuItem] : []),
      { label: running && !def.single ? '新建窗口' : '打开', icon: <WindowNew16Regular />, onClick: () => (def.single ? wm.launch(app) : wm.open(app)) },
      ...(running ? [{ label: mine.length > 1 ? '关闭所有窗口' : '关闭窗口', icon: <Dismiss16Regular />, onClick: () => mine.forEach(w => wm.close(w.id)) } as MenuItem] : []),
    ];
    openMenu({ x: r.left + r.width / 2 - 100, y: r.top - 12, anchor: r, placement: 'above', items });
  };

  return (
    <button
      type="button"
      className="dock-btn"
      data-dock-app={app}
      data-running={running}
      data-active={active}
      data-multi={mine.length > 1}
      data-new={hop}
      data-tip={running ? undefined : def.name}
      onPointerEnter={e => e.pointerType !== 'touch' && (running ? peek.enter(app, e.currentTarget) : peek.hide())}
      onPointerLeave={peek.leave}
      onPointerDown={peek.hide}
      onClick={() => useWm.getState().dockClick(app)}
      onContextMenu={menu}
    >
      <img src={def.icon} alt={def.name} />
    </button>
  );
}

export function Taskbar() {
  const flyout = useSys(s => s.flyout);
  const toggle = useSys(s => s.toggleFlyout);
  const align = useSys(s => s.dockAlign);
  const shape = useSys(s => s.dockShape);
  const style = useSys(s => s.taskbarStyle);
  const { wifi, airplane, volume, muted, batterySaver } = useSys();
  const wins = useWm(s => s.wins);
  const now = useNow(5000);
  const lang = useSys(s => s.lang);
  const { peek, api } = useDockPeek();

  const running = [...new Set(wins.filter(w => !w.closing).map(w => w.app))].filter(a => !DOCK_PINNED.includes(a));
  const solid = wins.some(w => w.snap === 'max' && !w.minimized && !w.closing);
  const SpeakerIcon = muted || volume === 0 ? SpeakerMute20Regular : volume < 34 ? Speaker020Regular : volume < 67 ? Speaker120Regular : Speaker220Regular;

  return (
    <>
    <div className="taskbar" data-solid={solid} data-align={align} data-shape={shape} data-style={style}>
      <Glass thickness="regular" edge={false} className="taskbar-plate" />
      <Glass thickness="regular" className="dock" noise>
        <button type="button" className="dock-btn" data-flyout-trigger data-open={flyout === 'start'} data-tip="开始" onClick={() => toggle('start')}>
          <Logo size={30} />
        </button>
        <button type="button" className="dock-btn dock-search" data-flyout-trigger data-tip="搜索" onClick={() => { useSys.getState().setFlyout('start'); setTimeout(() => document.querySelector<HTMLInputElement>('.start-search input')?.focus(), 60); }}>
          <Search24Regular />
        </button>
        {style === 'dock' && <span className="dock-gap" />}
        {DOCK_PINNED.map(a => <DockApp key={a} app={a} peek={api} />)}
        {running.length > 0 && <span className="dock-sep" />}
        {running.map(a => <DockApp key={a} app={a} peek={api} />)}
      </Glass>

      <Glass thickness="regular" className="tray" noise>
        <button
          type="button"
          className="tray-btn"
          data-tip="显示隐藏的图标"
          style={{ padding: 0, width: 28 }}
          onClick={e => openMenuAt(e.currentTarget, [
            { header: "后台运行" },
            { label: "Liber Buds Pro", icon: <Bluetooth16Regular />, hint: "82%" },
            { label: "安全中心", icon: <ShieldCheckmark16Regular />, hint: "无需操作", onClick: () => useWm.getState().launch("settings", { page: "privacy" }) },
            { label: "云同步", icon: <CloudSync16Regular />, hint: "已是最新" },
          ], { placement: "above" })}
        >
          <ChevronUp16Regular />
        </button>
        <button
          type="button"
          className="tray-btn tray-ime"
          data-lang={lang}
          data-tip={lang === 'en' ? 'English (United States) · Click to switch to 中文' : '中文（简体）· 点击切换到 English'}
          onClick={() => useSys.getState().setLanguage(lang === 'en' ? 'zh' : 'en')}
        >
          {lang === 'en' ? 'ENG' : '中'}
        </button>
        <button type="button" className="tray-btn" data-flyout-trigger data-open={flyout === 'control'} data-tip="控制中心" onClick={() => toggle('control')}>
          {airplane ? <Airplane20Regular /> : wifi ? <Wifi120Regular /> : <WifiOff20Regular />}
          <SpeakerIcon />
          {batterySaver ? <BatterySaver20Regular /> : <Battery820Regular />}
        </button>
        <button type="button" className="tray-btn tray-clock tnum" data-flyout-trigger data-open={flyout === 'calendar'} data-tip={fmtDateLong(now)} onClick={() => toggle('calendar')}>
          <span>{fmtTime(now)}</span>
          <span>{fmtDate(now)}</span>
        </button>
        <button type="button" className="tray-peek" data-tip="显示桌面" aria-label="显示桌面" onClick={() => useWm.getState().showDesktop()} />
      </Glass>
    </div>
    <DockPeek peek={peek} api={api} />
    </>
  );
}

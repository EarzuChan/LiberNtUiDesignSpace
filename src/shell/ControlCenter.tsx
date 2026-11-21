import { useEffect, useState } from 'react';
import { useSys } from '@/lib/system';
import { useWm } from '@/lib/wm';
import { wallpaperThumb } from '@/lib/wallpapers';
import { Button, Glass, Slider, Switch } from '@/ui';
import {
  Airplane20Regular, ArrowLeft16Regular, Battery820Regular, Bluetooth20Regular, BrightnessHigh20Filled, ChevronRight16Regular, DarkTheme20Regular,
  Edit20Regular, Headphones20Regular, LockClosed16Regular, Next20Filled, Pause20Filled, Play20Filled, Previous20Filled, Settings20Regular,
  Speaker220Filled, SpeakerMute20Filled, Timer20Regular, WeatherMoon20Regular, Wifi120Regular, Wifi220Regular, Wifi320Regular, Checkmark16Regular,
} from '@/ui/icons';
import { useFlyout } from './hooks';

const NETWORKS = [
  { name: 'LiberNT-5G', level: 1, secure: true },
  { name: 'LiberNT-2.4G', level: 1, secure: true },
  { name: 'Studio-Guest', level: 2, secure: false },
  { name: 'CMCC-Home-8F2A', level: 2, secure: true },
  { name: 'TP-LINK_Office', level: 3, secure: true },
];
const TRACKS = [["Blue Hour", "Liber Ensemble · 潮汐", "dahlia"], ["Night Drive", "Aurora Lane · 星夜", "starlight"], ["晨间漫步", "山谷乐队 · 优胜美地", "valley"]];
const WifiIcon = [Wifi120Regular, Wifi120Regular, Wifi220Regular, Wifi320Regular];

export function ControlCenter() {
  const { show, state } = useFlyout('control');
  const s = useSys();
  const [sub, setSub] = useState<null | 'wifi'>(null);
  const [playing, setPlaying] = useState(true);
  const [track, setTrack] = useState(0);
  useEffect(() => { if (!show) setSub(null); }, [show]);
  if (!show) return null;
  const openSettings = (page: string) => { s.setFlyout(null); useWm.getState().launch('settings', { page }); };

  return (
    <Glass thickness="thick" className="flyout cc" data-state={state} noise>
      {sub === 'wifi' ? (
        <div className="cc-sub">
          <div className="cc-sub-head">
            <Button variant="subtle" size="sm" iconOnly icon={<ArrowLeft16Regular />} onClick={() => setSub(null)} />
            <span className="grow">WLAN</span>
            <Switch checked={s.wifi} onChange={v => s.set({ wifi: v, airplane: v ? false : s.airplane })} />
          </div>
          {s.wifi ? NETWORKS.map(n => {
            const Icon = WifiIcon[n.level];
            const current = n.name === s.wifiNetwork;
            return (
              <button key={n.name} type="button" className="cc-net" aria-current={current} onClick={() => s.set({ wifiNetwork: n.name })}>
                <Icon />
                <div className="grow"><div>{n.name}</div>{current && <div className="t-caption c-2">已连接，安全</div>}</div>
                {current ? <Checkmark16Regular className="c-accent" /> : n.secure && <LockClosed16Regular className="c-3" />}
              </button>
            );
          }) : <div className="notif-empty">WLAN 已关闭</div>}
          <Button variant="subtle" style={{ alignSelf: 'flex-start', marginTop: 4 }} onClick={() => openSettings('network')}>更多 WLAN 设置</Button>
        </div>
      ) : (
        <>
          <div className="cc-grid">
            <div className="cc-card cc-conn">
              <div className="cc-row" role="group">
                <button type="button" className="cc-orb" aria-pressed={s.wifi && !s.airplane} onClick={() => s.set({ wifi: !s.wifi, airplane: false })}><Wifi120Regular /></button>
                <button type="button" className="row grow" style={{ textAlign: 'left', minWidth: 0 }} onClick={() => setSub('wifi')}>
                  <div className="cc-text"><div>WLAN</div><div>{s.airplane ? '飞行模式' : s.wifi ? s.wifiNetwork : '已关闭'}</div></div>
                  <ChevronRight16Regular className="c-3" />
                </button>
              </div>
              <button type="button" className="cc-row" aria-pressed={s.bluetooth && !s.airplane} onClick={() => s.set({ bluetooth: !s.bluetooth, airplane: false })}>
                <span className="cc-orb"><Bluetooth20Regular /></span>
                <div className="cc-text"><div>蓝牙</div><div>{s.bluetooth && !s.airplane ? 'Liber Buds Pro' : '已关闭'}</div></div>
              </button>
              <button type="button" className="cc-row" aria-pressed={s.airplane} onClick={() => s.set({ airplane: !s.airplane })}>
                <span className="cc-orb"><Airplane20Regular /></span>
                <div className="cc-text"><div>飞行模式</div><div>{s.airplane ? '已开启' : '已关闭'}</div></div>
              </button>
            </div>
            <div className="cc-side">
              <button type="button" className="cc-card cc-focus" aria-pressed={s.focus} onClick={() => s.set({ focus: !s.focus })}>
                <span className="cc-orb"><Timer20Regular /></span>
                <div className="cc-text"><div>专注模式</div><div>{s.focus ? '勿扰已开启' : '已关闭'}</div></div>
              </button>
              <div className="cc-minis">
                <button type="button" className="cc-card cc-mini" aria-pressed={s.nightLight} onClick={() => s.set({ nightLight: !s.nightLight })}>
                  <span className="cc-orb"><WeatherMoon20Regular /></span>夜间模式
                </button>
                <button type="button" className="cc-card cc-mini" aria-pressed={s.theme === 'dark'} onClick={() => s.set({ theme: s.theme === 'dark' ? 'light' : 'dark' })}>
                  <span className="cc-orb"><DarkTheme20Regular /></span>深色模式
                </button>
              </div>
            </div>
          </div>

          <div className="cc-card cc-slider">
            <div className="cc-slider-head"><span>显示器</span><span className="tnum">{s.brightness}%</span></div>
            <Slider fat value={s.brightness} min={10} onChange={v => s.set({ brightness: v })} icon={<BrightnessHigh20Filled />} />
          </div>
          <div className="cc-card cc-slider">
            <div className="cc-slider-head"><span>声音</span><span className="row gap-4"><Headphones20Regular style={{ width: 14, height: 14 }} />Liber Buds Pro</span></div>
            <Slider fat value={s.muted ? 0 : s.volume} onChange={v => s.set({ volume: v, muted: false })} icon={s.muted || s.volume === 0 ? <SpeakerMute20Filled /> : <Speaker220Filled />} />
          </div>

          <div className="cc-card cc-media">
            <img key={track} src={wallpaperThumb(TRACKS[track][2])} alt="" />
            <div className="grow">
              <div className="t-body-strong ellipsis">{TRACKS[track][0]}</div>
              <div className="t-caption c-2 ellipsis">{TRACKS[track][1]}</div>
            </div>
            <div className="cc-media-ctl">
              <Button variant="subtle" iconOnly icon={<Previous20Filled />} onClick={() => setTrack((track + TRACKS.length - 1) % TRACKS.length)} />
              <Button variant="accent" pill iconOnly icon={playing ? <Pause20Filled /> : <Play20Filled />} onClick={() => setPlaying(!playing)} />
              <Button variant="subtle" iconOnly icon={<Next20Filled />} onClick={() => setTrack((track + 1) % TRACKS.length)} />
            </div>
          </div>

          <div className="cc-foot">
            <Button variant="subtle" icon={<Battery820Regular />} onClick={() => openSettings('system')}>86%</Button>
            <div className="row gap-4">
              <Button variant="subtle" iconOnly tip="编辑快捷设置" icon={<Edit20Regular />} />
              <Button variant="subtle" iconOnly tip="所有设置" icon={<Settings20Regular />} onClick={() => openSettings('system')} />
            </div>
          </div>
        </>
      )}
    </Glass>
  );
}

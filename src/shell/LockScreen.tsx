import { useEffect, useRef, useState } from 'react';
import { useSys } from '@/lib/system';
import { resolveWallpaper } from '@/lib/wallpapers';
import { WallpaperLayer } from '@/ui/WallpaperLayer';
import { Avatar, TextField } from '@/ui';
import { ArrowRight16Regular, Battery820Regular, Wifi120Regular, WifiOff20Regular } from '@/ui/icons';
import { fmtDateLong, fmtTime, useNow } from './hooks';

/** 锁屏：时钟 → 点击/按键 → 登录（背景渐进模糊）→ 解锁上滑 */
export function LockScreen() {
  const locked = useSys(s => s.locked);
  const fit = useSys(s => s.wallpaperFit);
  const dim = useSys(s => s.wallpaperDim);
  const tinted = useSys(s => s.dimTinted);
  const wp = resolveWallpaper(useSys(s => s.wallpaper), useSys(s => s.theme));
  const user = useSys(s => s.userName);
  const wifi = useSys(s => s.wifi && !s.airplane);
  const [stage, setStage] = useState<'clock' | 'login'>('clock');
  const [leaving, setLeaving] = useState(false);
  const [pin, setPin] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const now = useNow(5000);

  const unlock = () => {
    setLeaving(true);
    setTimeout(() => {
      useSys.getState().set({ locked: false });
      setLeaving(false); setStage('clock'); setPin('');
    }, 400);
  };
  useEffect(() => {
    if (!locked) return;
    const on = (e: KeyboardEvent) => {
      if (stage === 'clock') { setStage('login'); e.preventDefault(); }
      else if (e.key === 'Escape') setStage('clock');
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [locked, stage]);
  useEffect(() => { if (stage === 'login') setTimeout(() => input.current?.focus(), 80); }, [stage]);

  if (!locked) return null;
  return (
    <div className="lock" data-theme="dark" data-stage={stage} data-leaving={leaving} onClick={() => stage === 'clock' && setStage('login')}>
      <div className="lock-wp"><WallpaperLayer url={wp.url} fit={fit} natural={wp} /><div className="wallpaper-dim" data-tinted={tinted} style={{ opacity: dim }} /></div>
      <div className="lock-veil" />
      <div className="lock-clock">
        <div className="lock-date">{fmtDateLong(now)}</div>
        <div className="lock-time">{fmtTime(now)}</div>
      </div>
      <div className="lock-hint">点击屏幕或按任意键解锁</div>
      <form className="lock-login" onSubmit={e => { e.preventDefault(); unlock(); }}>
        <Avatar size={104} />
        <div className="t-title" style={{ fontWeight: 600 }}>{user}</div>
        <TextField
          inputRef={input}
          value={pin}
          onChange={setPin}
          type="password"
          pill
          large
          placeholder="PIN"
          suffix={<button type="submit" className="lock-go" data-tip="登录"><ArrowRight16Regular /></button>}
        />
        <div className="t-caption" style={{ opacity: 0.7 }}>演示环境：直接按 Enter 即可登录</div>
      </form>
      <div className="lock-status">{wifi ? <Wifi120Regular /> : <WifiOff20Regular />}<Battery820Regular /></div>
    </div>
  );
}

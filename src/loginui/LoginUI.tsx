import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { APPS, type AppId } from '@/lib/apps';
import { luma } from '@/lib/luma';
import { isEnd, useSession, type EndAction } from '@/lib/session';
import { useSys } from '@/lib/system';
import { resolveWallpaper } from '@/lib/wallpapers';
import { useWm } from '@/lib/wm';
import { fmtDateLong, fmtTime, useNow } from '@/shell/hooks';
import { Avatar, Button, Glass, ProgressRing, TextField, openMenuAt } from '@/ui';
import { WallpaperLayer } from '@/ui/WallpaperLayer';
import {
  Accessibility20Regular, ArrowClockwise16Regular, ArrowRight16Regular, ArrowSync16Regular, Battery820Regular, Fingerprint20Regular, Fingerprint48Regular,
  Key20Regular, Password20Regular, Power20Regular, WeatherMoon16Regular, Wifi120Regular, WifiOff20Regular,
} from '@/ui/icons';
import './loginui.css';

/**
 * T2 · 安全桌面：锁屏 → 登录 → 欢迎，以及睡眠、注销 / 重启 / 关机（含「应用阻止关机」）和熄屏。
 * 阶段由 useSession 驱动。独立页面（/loginui.html）整页显示；桌面里以 embedded 嵌入，盖在会话之上。
 *
 * 分层：壁纸 → 时钟背后的渐变 → 压暗/模糊层 → 内容 → 熄屏层。登录阶段整屏模糊后相当于一整块玻璃，
 * 其上的控件用「玻璃上的项目」那组 token（--fill-plate*）；锁屏阶段直接叠在壁纸上的只有文字和两处真玻璃。
 */
interface User { id: string; name: string; avatar: string; secured: boolean }
type Method = 'pin' | 'password' | 'finger';

const OTHERS: User[] = [
  { id: 'lin', name: '林澈', avatar: '/emoji/owl.png', secured: true },
  { id: 'guest', name: '访客', avatar: '/emoji/polar_bear.png', secured: false },
];
const METHODS: [Method, string, ReactNode][] = [['pin', 'PIN', <Password20Regular />], ['password', '密码', <Key20Regular />], ['finger', '指纹', <Fingerprint20Regular />]];
const NOTICE_APPS: AppId[] = ['mail', 'store', 'security'];
const A11Y = ['讲述人', '放大镜', '高对比度', '屏幕键盘', '粘滞键'];
const MODIFIERS = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'];

/** 结束会话的各个操作：显示的文案，以及熄屏之后去往的场景 */
const END: Record<EndAction, { title: string; note?: string; to: string }> = {
  signout: { title: '正在注销', to: '/loginui.html' },
  restart: { title: '正在重启', to: '/boot.html?flow' },
  shutdown: { title: '正在关机', to: '/loginui.html?phase=off' },
  update: { title: '正在准备更新', note: '请保持设备通电，不要关机', to: '/boot.html?flow&mode=update' },
};
const BLOCKED: Record<EndAction, [title: string, go: string]> = {
  signout: ['这些应用阻止注销', '仍要注销'],
  restart: ['这些应用阻止重启', '仍要重启'],
  update: ['这些应用阻止重启', '仍要重启'],
  shutdown: ['这些应用阻止关机', '仍要关机'],
};
/** 独立页面里没有真实窗口，审阅「应用阻止关机」时用示例 */
const SAMPLE_BLOCKERS: { id: string; app: AppId; title: string }[] = [
  { id: 'a', app: 'notepad', title: '会议纪要.txt - 记事本' },
  { id: 'b', app: 'notepad', title: '无标题 - 记事本' },
];

/**
 * 壁纸越亮压得越多，保证白字可读。返回两个 0~1 的强度：
 * clock 取时钟区域的亮度，用于锁屏上下两端的渐变；all 取整屏平均亮度，用于登录阶段模糊层之下的整屏压暗。
 */
function useScrim(active: boolean) {
  const [v, setV] = useState({ clock: 0, all: 0 });
  useEffect(() => {
    if (!active) return;
    const sample = () => {
      const w = innerWidth, h = innerHeight;
      const level = (mean: number, from: number) => Math.round(Math.min(1, Math.max(0, (mean - from) * 1.7)) * 20) / 20;
      let clock = 0, all = 0;
      for (let j = 0; j < 3; j++) for (let i = 0; i < 5; i++) clock += luma.at(w * (0.3 + 0.1 * i), h * 0.13 + 30 + 70 * j);
      for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) all += luma.at(w * (i + 0.5) / 6, h * (j + 0.5) / 4);
      const next = { clock: level(clock / 15, 0.42), all: level(all / 24, 0.38) };
      setV(cur => (cur.clock === next.clock && cur.all === next.all ? cur : next));
    };
    sample();
    const t = setInterval(sample, 600);
    return () => clearInterval(t);
  }, [active]);
  return v;
}

export function LoginUI({ embedded = false }: { embedded?: boolean }) {
  const phase = useSession(s => s.phase);
  const pending = useSession(s => s.pending);
  const held = useSession(s => s.held);
  const session = useSession.getState();
  const lang = useSys(s => s.lang);
  const fit = useSys(s => s.wallpaperFit);
  const dim = useSys(s => s.wallpaperDim);
  const tinted = useSys(s => s.dimTinted);
  const wp = resolveWallpaper(useSys(s => s.wallpaper), useSys(s => s.theme));
  const userName = useSys(s => s.userName);
  const online = useSys(s => s.wifi && !s.airplane);
  const airplane = useSys(s => s.airplane);
  const network = useSys(s => s.wifiNetwork);
  useSys(s => s.wallpaperRev);
  const dirty = useWm(s => s.wins).filter(w => w.dirty);
  const now = useNow(5000);

  const [who, setWho] = useState(0);
  const [method, setMethod] = useState<Method>('pin');
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(0);
  const [caps, setCaps] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [leaving, setLeaving] = useState(false);
  // 熄屏层：独立页面从黑场淡入；结束会话时淡出到黑
  const [dark, setDark] = useState(!embedded);
  const [a11y, setA11y] = useState<Record<string, boolean>>({});
  const input = useRef<HTMLInputElement>(null);

  const active = phase !== 'desktop';
  const scrim = useScrim(active);
  const users: User[] = [{ id: 'me', name: userName, avatar: '/emoji/fox.png', secured: true }, ...OTHERS];
  const user = users[who];
  const view = phase === 'lock' ? 'clock' : phase === 'login' ? 'login' : phase === 'welcome' ? 'welcome' : phase === 'blocked' ? 'blocked' : isEnd(phase) ? 'end' : 'dark';
  const black = dark || phase === 'sleep' || phase === 'off';
  const powerOn = () => { location.href = '/boot.html?flow'; };

  useEffect(() => {
    if (embedded) return;
    const t = setTimeout(() => setDark(false), 80);
    return () => clearTimeout(t);
  }, [embedded]);

  // 进入安全桌面时收走会话里的焦点；回到锁屏时清掉输入
  useEffect(() => {
    if (!active) return;
    const el = document.activeElement as HTMLElement | null;
    if (el && !el.closest('.lu')) el.blur();
    if (phase === 'lock') { setValue(''); setError(false); setScanning(false); }
  }, [phase, active]);

  useEffect(() => {
    if (phase !== 'login' || method === 'finger' || !user.secured) return;
    const t = setTimeout(() => input.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [phase, method, who, user.secured]);

  // 欢迎：嵌入时揭开桌面，独立页面淡出后进入桌面
  useEffect(() => {
    if (phase !== 'welcome' || held) return;
    const a = setTimeout(() => (embedded ? setLeaving(true) : setDark(true)), 1500);
    const b = setTimeout(() => {
      if (!embedded) return void (location.href = '/');
      session.go('desktop');
      setLeaving(false);
    }, embedded ? 2020 : 2300);
    return () => { clearTimeout(a); clearTimeout(b); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, held, embedded]);

  // 注销 / 重启 / 关机：停留片刻 → 熄屏 → 去往下一个场景
  useEffect(() => {
    if (!isEnd(phase) || held) return;
    const a = setTimeout(() => setDark(true), 2600);
    const b = setTimeout(() => { location.href = END[phase].to; }, 3500);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [phase, held]);

  /** 取消（应用阻止关机时）：嵌入时退回桌面，独立页面退回登录 */
  const dismiss = () => {
    if (!embedded) return session.go('login');
    setLeaving(true);
    setTimeout(() => { session.go('desktop'); setLeaving(false); }, 480);
  };

  // 按键在捕获阶段处理，不让它们漏到下面的桌面
  useEffect(() => {
    if (!active) return;
    const on = (e: KeyboardEvent) => {
      if (MODIFIERS.includes(e.key)) return;
      const inside = !!(e.target as Element | null)?.closest?.('.lu, .menu-layer');
      if (phase === 'lock') { session.go('login'); e.preventDefault(); }
      else if (phase === 'sleep') { session.go('lock'); e.preventDefault(); }
      else if (phase === 'off') powerOn();
      else if (phase === 'login') {
        if (e.key === 'Escape') session.go('lock');
        else if (!inside) input.current?.focus();
      } else if (phase === 'blocked' && e.key === 'Escape') dismiss();
      if (!inside) e.stopPropagation();
    };
    window.addEventListener('keydown', on, true);
    return () => window.removeEventListener('keydown', on, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, active]);

  if (!active && !leaving) return null;

  const attempt = (v: string) => {
    if (phase !== 'login') return;
    // 演示环境：只有 0000 会被拒绝，用来查看错误状态
    if (user.secured && v === '0000') { setError(true); setValue(''); setShake(n => n + 1); return; }
    session.go('welcome');
  };
  const change = (v: string) => {
    setError(false);
    if (method !== 'pin') return setValue(v);
    const pin = v.replace(/\D/g, '').slice(0, 4);
    setValue(pin);
    if (pin.length === 4) attempt(pin);
  };
  const touch = () => {
    if (scanning) return;
    setScanning(true);
    setTimeout(() => { setScanning(false); if (useSession.getState().phase === 'login') session.go('welcome'); }, 800);
  };
  const pick = (i: number) => { setWho(i); setValue(''); setError(false); };
  const capsOf = (e: ReactKeyboardEvent) => setCaps(e.getModifierState('CapsLock'));

  const powerMenu = (el: Element) => openMenuAt(el, [
    { label: '睡眠', icon: <WeatherMoon16Regular />, onClick: () => session.go('sleep') },
    { separator: true },
    { label: '更新并重启', icon: <ArrowSync16Regular />, onClick: () => session.end('update') },
    { label: '重启', icon: <ArrowClockwise16Regular />, onClick: () => session.end('restart') },
    { label: '关机', icon: <Power20Regular style={{ width: 16, height: 16 }} />, onClick: () => session.end('shutdown') },
  ], { placement: 'above' });
  const networkMenu = (el: Element) => openMenuAt(el, [
    { header: 'WLAN' },
    { label: network, checked: online, onClick: () => useSys.getState().set({ wifi: !online, airplane: false }) },
    { separator: true },
    { label: '飞行模式', checked: airplane, onClick: () => useSys.getState().set({ airplane: !airplane }) },
  ], { placement: 'above' });
  const a11yMenu = (el: Element) => openMenuAt(el, A11Y.map(label => ({ label, checked: !!a11y[label], onClick: () => setA11y(s => ({ ...s, [label]: !s[label] })) })), { placement: 'above' });

  const [msgKind, msg] =
    !user.secured ? ['', '此账户没有设置密码']
    : error ? ['error', method === 'pin' ? 'PIN 不正确，请再试一次' : '密码不正确，请再试一次']
    : method === 'finger' ? ['', scanning ? '正在识别…' : '触摸指纹传感器']
    : caps && method === 'password' ? ['caps', '大写锁定已打开']
    : ['', '演示环境：按 Enter 直接登录，输入 0000 查看错误状态'];
  const blockers = dirty.length ? dirty : SAMPLE_BLOCKERS;

  return (
    <div
      className="lu"
      data-theme="dark"
      data-overlay-theme="dark"
      data-view={view}
      data-embedded={embedded}
      data-leaving={leaving}
      data-black={black}
      onClick={() => { if (phase === 'lock') session.go('login'); else if (phase === 'sleep') session.go('lock'); else if (phase === 'off') powerOn(); }}
    >
      <div className="lu-wp"><WallpaperLayer url={wp.url} fit={fit} natural={wp} /><div className="wallpaper-dim" data-tinted={tinted} style={{ opacity: dim }} /></div>
      <div className="lu-scrim" style={{ opacity: view === 'clock' ? scrim.clock : 0 }} />
      <div className="lu-shade" style={{ opacity: view === 'clock' || view === 'dark' ? 0 : scrim.all }} />
      <div className="lu-veil" />

      {/* 锁屏：时钟、一瞥信息、通知摘要 */}
      <div className="lu-clock">
        <div className="lu-date">{fmtDateLong(now)}</div>
        <div className="lu-time">{fmtTime(now)}</div>
        <div className="lu-glance"><img src="/emoji/sun_behind_cloud.png" alt="" /><span>18°</span><span>多云转晴</span></div>
      </div>
      <Glass thickness="thin" layer="desktop" className="lu-chip" noise>
        <span className="lu-chip-icons">{NOTICE_APPS.map(a => <img key={a} src={APPS[a].icon} alt="" />)}</span>
        <span>3 条新通知</span>
      </Glass>
      <div className="lu-hint">点击屏幕或按任意键解锁</div>
      <div className="lu-status">{online ? <Wifi120Regular /> : <WifiOff20Regular />}<Battery820Regular /></div>

      {/* 登录 / 欢迎 */}
      <form className="lu-login" inert={view !== 'login'} onSubmit={e => { e.preventDefault(); attempt(value); }}>
        <Avatar size={104} src={user.avatar} />
        <div className="lu-name">{user.name}</div>
        {view === 'welcome' ? (
          <div className="lu-welcome"><ProgressRing size={20} /><span>欢迎</span></div>
        ) : (
          <>
            {!user.secured ? (
              <Button variant="accent" pill size="lg" type="submit" className="lu-enter">登录</Button>
            ) : method === 'finger' ? (
              <button type="button" className="lu-finger" data-scanning={scanning} data-tip="点击模拟触摸传感器" onClick={touch}><Fingerprint48Regular /></button>
            ) : (
              <TextField
                fieldClassName={`lu-field${shake ? ` lu-shake-${shake % 2 ? 'a' : 'b'}` : ''}`}
                inputRef={input}
                value={value}
                onChange={change}
                onKeyDown={capsOf}
                onKeyUp={capsOf}
                type="password"
                inputMode={method === 'pin' ? 'numeric' : undefined}
                autoComplete="off"
                pill
                large
                placeholder={method === 'pin' ? 'PIN' : '密码'}
                suffix={<button type="submit" className="lu-go" data-ready={!!value} data-tip="登录"><ArrowRight16Regular /></button>}
              />
            )}
            <div className="lu-msg" data-kind={msgKind}>{msg}</div>
            {user.secured && (
              <div className="lu-opts">
                {METHODS.map(([m, label, icon]) => (
                  <button key={m} type="button" className="lu-opt" aria-pressed={m === method} data-tip={label} onClick={() => { setMethod(m); setValue(''); setError(false); }}>{icon}</button>
                ))}
              </div>
            )}
          </>
        )}
      </form>
      <div className="lu-users" inert={view !== 'login'}>
        {users.map((u, i) => (
          <button key={u.id} type="button" className="lu-user" aria-pressed={i === who} onClick={() => pick(i)}><Avatar size={32} src={u.avatar} /><span>{u.name}</span></button>
        ))}
      </div>
      <Glass thickness="regular" layer="desktop" className="lu-corner" noise inert={view !== 'login'}>
        <button
          type="button"
          className="lu-btn lu-ime"
          data-tip={lang === 'en' ? 'English (United States) · Click to switch to 中文' : '中文（简体）· 点击切换到 English'}
          onClick={() => useSys.getState().setLanguage(lang === 'en' ? 'zh' : 'en')}
        >
          {lang === 'en' ? 'ENG' : '中'}
        </button>
        <button type="button" className="lu-btn" data-tip={online ? network : '未连接'} onClick={e => networkMenu(e.currentTarget)}>{online ? <Wifi120Regular /> : <WifiOff20Regular />}</button>
        <button type="button" className="lu-btn" data-tip="辅助功能" onClick={e => a11yMenu(e.currentTarget)}><Accessibility20Regular /></button>
        <button type="button" className="lu-btn" data-tip="电源" onClick={e => powerMenu(e.currentTarget)}><Power20Regular /></button>
      </Glass>

      {/* 注销 / 重启 / 关机 */}
      {isEnd(phase) && (
        <div className="lu-end">
          <ProgressRing size={28} />
          <div className="lu-title">{END[phase].title}</div>
          {END[phase].note && <div className="lu-note">{END[phase].note}</div>}
        </div>
      )}
      {phase === 'blocked' && pending && (
        <div className="lu-blocked">
          <div className="lu-title">{BLOCKED[pending][0]}</div>
          <div className="lu-note">这些应用里有尚未保存的更改。继续的话，更改会丢失。</div>
          <div className="group lu-block-list">
            {blockers.map(w => (
              <div key={w.id} className="lu-block-row">
                <img src={APPS[w.app].icon} alt="" />
                <div><div className="t-body-strong ellipsis">{w.title}</div><div className="t-caption c-2">有未保存的更改</div></div>
              </div>
            ))}
          </div>
          <div className="lu-block-actions">
            <Button variant="accent" pill size="lg" onClick={() => session.end(pending, true)}>{BLOCKED[pending][1]}</Button>
            <Button pill size="lg" onClick={dismiss}>取消</Button>
          </div>
        </div>
      )}

      <div className="lu-black">{phase === 'off' && <span>按任意键开机</span>}</div>
    </div>
  );
}

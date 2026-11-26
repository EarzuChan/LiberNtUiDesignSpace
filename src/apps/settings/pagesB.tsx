import { useEffect, useState } from 'react';
import { useSys } from '@/lib/system';
import { fmtDateFull, fmtTime, useNow } from '@/shell/hooks';
import { Button, Expander, InfoBar, ProgressBar, SettingRow, Slider, Switch } from '@/ui';
import { Logo } from '@/ui/Logo';
import {
  Camera20Regular, CheckmarkCircle20Filled, Clock20Regular, Copy16Regular, Cursor20Regular, Desktop20Regular, Drop20Regular, Eye20Regular,
  GlobeClock20Regular, History20Regular, Keyboard20Regular, LocalLanguage20Regular, Location20Regular, Mic20Regular, Open16Regular, Options20Regular,
  ShieldCheckmark20Regular, Sparkle20Regular, TextFont20Regular, Alert20Regular, Info20Regular, ArrowSync20Regular,
} from '@/ui/icons';
import type { PageProps } from './Settings';
import { Group, Select } from './parts';

export function TimePage() {
  const now = useNow(1000);
  const [auto, setAuto] = useState(true);
  const [zone, setZone] = useState('(UTC+08:00) 北京，上海');
  const lang = useSys(s => s.lang);
  const setLanguage = useSys(s => s.setLanguage);
  const [h24, setH24] = useState(true);
  return (
    <>
      <div className="card set-hero">
        <div>
          <div className="t-title-large tnum" style={{ fontWeight: 300 }}>{fmtTime(now)}<span className="t-subtitle c-3 tnum" style={{ marginLeft: 6, fontWeight: 400 }}>{String(now.getSeconds()).padStart(2, '0')}</span></div>
          <div className="c-2">{fmtDateFull(now)}</div>
        </div>
      </div>
      <Group title="日期和时间">
        <SettingRow icon={<Clock20Regular />} title="自动设置时间" desc="使用 Internet 时间服务器同步"><Switch checked={auto} onChange={setAuto} /></SettingRow>
        <SettingRow icon={<GlobeClock20Regular />} title="时区"><Select value={zone} onChange={setZone} width={220} options={['(UTC+08:00) 北京，上海', '(UTC+09:00) 东京，首尔', '(UTC+00:00) 伦敦', '(UTC-08:00) 太平洋时间']} /></SettingRow>
        <SettingRow icon={<Clock20Regular />} title="使用 24 小时制"><Switch checked={h24} onChange={setH24} /></SettingRow>
      </Group>
      <Group title="语言和区域">
        <SettingRow icon={<LocalLanguage20Regular />} title="显示语言" desc="设置、文件管理器等系统功能将以此语言显示；也可点击任务栏托盘里的输入法指示器切换"><Select value={lang === 'zh' ? '中文（简体）' : 'English (United States)'} onChange={v => setLanguage(v === '中文（简体）' ? 'zh' : 'en')} options={['English (United States)', '中文（简体）']} width={200} /></SettingRow>
        <Expander icon={<Keyboard20Regular />} title="输入法" desc="微软拼音、英语（美国）">
          <SettingRow title="中文（简体）· 微软拼音" desc="默认输入法"><Button>选项</Button></SettingRow>
          <SettingRow title="英语（美国）" desc="美式键盘"><Button>选项</Button></SettingRow>
        </Expander>
      </Group>
    </>
  );
}

export function AccessibilityPage() {
  const s = useSys();
  const [size, setSize] = useState(100);
  const [contrast, setContrast] = useState('无');
  const [pointer, setPointer] = useState(1);
  return (
    <>
      <Group title="视觉">
        <SettingRow icon={<TextFont20Regular />} title="文本大小" desc={<span style={{ fontSize: 12 * (size / 100) }}>预览：敏捷的棕色狐狸跳过了懒狗 Aa</span>}>
          <span className="c-2 tnum">{size}%</span>
          <Slider value={size} min={100} max={200} onChange={setSize} style={{ flex: '0 0 200px' }} />
        </SettingRow>
        <SettingRow icon={<Sparkle20Regular />} title="动画效果" desc="关闭后将跳过窗口与控件的过渡动画"><Switch checked={s.animations} onChange={v => s.set({ animations: v })} /></SettingRow>
        <SettingRow icon={<Drop20Regular />} title="透明效果" desc="关闭后所有玻璃材质回退为实色表面"><Switch checked={s.transparency} onChange={v => s.set({ transparency: v })} /></SettingRow>
        <SettingRow icon={<Eye20Regular />} title="对比度主题" desc="为弱视用户提供更高对比度的配色"><Select value={contrast} onChange={setContrast} options={['无', '水生', '沙漠', '黄昏', '夜空']} /></SettingRow>
      </Group>
      <Group title="交互">
        <SettingRow icon={<Cursor20Regular />} title="鼠标指针大小"><Slider value={pointer} min={1} max={15} onChange={setPointer} style={{ flex: '0 0 200px' }} /></SettingRow>
        <SettingRow icon={<Keyboard20Regular />} title="粘滞键" desc="一次按一个键来使用键盘快捷方式"><Switch checked={false} /></SettingRow>
      </Group>
    </>
  );
}

export function PrivacyPage({ open }: PageProps) {
  const s = useSys();
  const [perm, setPerm] = useState({ camera: true, mic: true, notify: true, diag: false });
  const row = (k: keyof typeof perm, icon: React.ReactNode, title: string, desc: string) => (
    <SettingRow icon={icon} title={title} desc={desc}><Switch checked={perm[k]} onChange={v => setPerm({ ...perm, [k]: v })} /></SettingRow>
  );
  return (
    <>
      <InfoBar severity="success" title="设备受到保护">安全中心运行正常，上次扫描：今天 09:30，未发现威胁。</InfoBar>
      <Group title="安全">
        <SettingRow icon={<ShieldCheckmark20Regular />} title="安全中心" desc="病毒防护、防火墙和设备安全" chevron onClick={() => open('security')} />
        <SettingRow icon={<Desktop20Regular />} title="查找我的设备" desc="设备丢失时进行定位、锁定或抹除"><Switch checked /></SettingRow>
      </Group>
      <Group title="应用权限">
        <SettingRow icon={<Location20Regular />} title="位置" desc="天气、地图等 3 个应用正在使用"><Switch checked={s.location} onChange={v => s.set({ location: v })} /></SettingRow>
        {row('camera', <Camera20Regular />, '摄像头', '允许应用访问摄像头')}
        {row('mic', <Mic20Regular />, '麦克风', '允许应用访问麦克风')}
        {row('notify', <Alert20Regular />, '通知', '允许应用读取通知内容')}
      </Group>
      <Group title="诊断">
        {row('diag', <Info20Regular />, '发送可选诊断数据', '帮助改进 LiberNT，不包含个人内容')}
      </Group>
    </>
  );
}

export function UpdatePage({ open }: PageProps) {
  const [state, setState] = useState<'idle' | 'checking' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (state !== 'checking') return;
    setProgress(0);
    const t = setInterval(() => setProgress(p => {
      if (p >= 100) { clearInterval(t); setState('done'); return 100; }
      return p + 4;
    }), 70);
    return () => clearInterval(t);
  }, [state]);
  return (
    <>
      <div className="card set-hero">
        <CheckmarkCircle20Filled style={{ width: 44, height: 44, color: 'var(--success)' }} />
        <div className="grow">
          <div className="t-subtitle">{state === 'checking' ? '正在检查更新…' : '你使用的是最新版本'}</div>
          <div className="c-2">{state === 'done' ? '上次检查时间：刚刚' : '上次检查时间：今天 18:20'}</div>
          {state === 'checking' && <ProgressBar value={progress} style={{ marginTop: 12, maxWidth: 360 }} />}
        </div>
        <Button variant="accent" size="lg" pill disabled={state === 'checking'} icon={<ArrowSync20Regular />} onClick={() => setState('checking')}>检查更新</Button>
      </div>
      <Group title="更多选项">
        <SettingRow icon={<History20Regular />} title="更新历史记录" desc="LiberNT 26.11（内部版本 26200.1742）于 11 月 12 日安装" chevron onClick={() => open('history')} />
        <SettingRow icon={<Options20Regular />} title="高级选项" desc="传递优化、可选更新、使用时段" chevron onClick={() => open('advanced')} />
        <SettingRow icon={<Sparkle20Regular />} title="预览体验计划" desc="抢先体验新功能并提供反馈"><Switch checked={false} /></SettingRow>
      </Group>
    </>
  );
}

const DEVICE = [['设备名称', ''], ['处理器', 'Liber Silicon L3 Pro · 12 核 @ 3.6 GHz'], ['机带内存', '32.0 GB（31.7 GB 可用）'], ['显卡', 'Liber Graphics 24 核 · 16 GB'], ['系统类型', '64 位操作系统，基于 ARM64 的处理器'], ['笔和触控', '10 点触控与笔支持']];
const SYSTEM = [['版本', 'LiberNT 26.11 专业版'], ['内部版本', '26200.1742'], ['安装日期', '2026/11/12'], ['体验', 'LiberNT Shell Experience 1026.4.2'], ['设计语言', 'Liber Design · Fluent 骨架 × 自适应玻璃']];

export function AboutPage() {
  const name = useSys(s => s.deviceName);
  const specs = (rows: string[][]) => <dl className="set-specs">{rows.map(([k, v]) => <span key={k} style={{ display: 'contents' }}><dt>{k}</dt><dd>{v || name}</dd></span>)}</dl>;
  return (
    <>
      <div className="set-about">
        <Logo size={72} />
        <div className="t-title" style={{ marginTop: 10 }}>LiberNT <span style={{ fontWeight: 300 }}>26.11</span></div>
        <div className="c-2">© 2026 LiberNT 设计草案 · 仅供个人参考</div>
      </div>
      <Group>
        <Expander icon={<Desktop20Regular />} title="设备规格" desc={name} defaultOpen trailing={<Button size="sm" icon={<Copy16Regular />} onClick={e => { e.stopPropagation(); navigator.clipboard?.writeText(DEVICE.map(r => r.join('\t')).join('\n')); }}>复制</Button>}>
          {specs(DEVICE)}
        </Expander>
        <Expander icon={<Info20Regular />} title="系统规格" desc="LiberNT 26.11 专业版" defaultOpen>
          {specs(SYSTEM)}
        </Expander>
        <SettingRow icon={<TextFont20Regular />} title="设计规范" desc="色库、字体、间距、圆角、材质与控件画廊">
          <Button icon={<Open16Regular />} onClick={() => window.open('/spec.html', '_blank')}>打开规范页</Button>
        </SettingRow>
      </Group>
    </>
  );
}

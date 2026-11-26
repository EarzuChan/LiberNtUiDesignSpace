import { useState, type ComponentType, type ReactNode } from 'react';
import { APPS, type AppId } from '@/lib/apps';
import { useSys } from '@/lib/system';
import { Badge, Button, Checkbox, Expander, InfoBar, SettingRow, Slider, Switch, TextField } from '@/ui';
import {
  Add16Regular, ArrowDownload20Regular, ArrowReset20Regular, Clock20Regular, Cloud20Regular, DataUsage20Regular, Delete16Regular, DocumentPdf20Regular,
  Eye20Regular, Fingerprint20Regular, Globe20Regular, History20Regular, Info20Regular, Keyboard20Regular, Mail20Regular, Options20Regular,
  People20Regular, Person20Regular, Print20Regular, ShieldCheckmark20Regular, ShieldLock20Regular, Timer20Regular,
  WifiSettings20Regular, WindowApps20Regular, Wrench20Regular,
} from '@/ui/icons';
import type { SettingsPageId } from './pages';
import type { PageProps } from './Settings';
import { Group, Select } from './parts';

/** 次级页：seg 是路径里属于这一页的那一段（应用详情用它取应用 id） */
export interface SubProps extends PageProps { seg: string }
interface Node { name: string; Page: ComponentType<SubProps>; sub?: (seg: string) => Node | undefined }
const table = (t: Record<string, Node>) => (seg: string) => t[seg];

const specs = (rows: [string, string][]) => (
  <dl className="set-specs" style={{ paddingLeft: 16 }}>{rows.map(([k, v]) => <span key={k} style={{ display: 'contents' }}><dt>{k}</dt><dd>{v}</dd></span>)}</dl>
);

/* ---------- 网络和 Internet ---------- */
function EthernetPage() {
  const [metered, setMetered] = useState(false);
  return (
    <>
      <InfoBar severity="caution" title="网线已拔出">将网线连接到此设备后即可使用以太网。</InfoBar>
      <Group>
        <SettingRow icon={<DataUsage20Regular />} title="按流量计费的连接" desc="某些应用在使用此网络时可能会减少数据用量"><Switch checked={metered} onChange={setMetered} /></SettingRow>
        <SettingRow icon={<WifiSettings20Regular />} title="IP 分配"><span className="c-2">自动 (DHCP)</span><Button>编辑</Button></SettingRow>
        <SettingRow icon={<Globe20Regular />} title="DNS 服务器分配"><span className="c-2">自动 (DHCP)</span><Button>编辑</Button></SettingRow>
      </Group>
      <Group title="属性">
        {specs([['制造商', 'Liber Networks'], ['描述', 'Liber 2.5GbE 以太网控制器'], ['驱动程序版本', '26.11.1042'], ['物理地址 (MAC)', '3C-A8-2A-6E-10-F4']])}
      </Group>
    </>
  );
}

function ProxyPage() {
  const [auto, setAuto] = useState(true);
  const [manual, setManual] = useState(false);
  const [addr, setAddr] = useState('');
  const [port, setPort] = useState('');
  return (
    <>
      <Group title="自动设置代理">
        <SettingRow icon={<Globe20Regular />} title="自动检测设置"><Switch checked={auto} onChange={setAuto} /></SettingRow>
        <SettingRow icon={<Options20Regular />} title="使用设置脚本"><Button>设置</Button></SettingRow>
      </Group>
      <Group title="手动设置代理">
        <SettingRow icon={<WifiSettings20Regular />} title="使用代理服务器" desc="不适用于 VPN 连接"><Switch checked={manual} onChange={setManual} /></SettingRow>
        {manual && (
          <SettingRow title="代理 IP 地址与端口">
            <TextField value={addr} onChange={setAddr} placeholder="地址" fieldStyle={{ width: 200 }} />
            <TextField value={port} onChange={setPort} placeholder="端口" fieldStyle={{ width: 80 }} />
            <Button variant="accent" disabled={!addr || !port}>保存</Button>
          </SettingRow>
        )}
      </Group>
    </>
  );
}

/* ---------- 蓝牙和设备 ---------- */
function KeyboardPage() {
  const [delay, setDelay] = useState(40);
  const [rate, setRate] = useState(70);
  const keys: [string, string][] = [['截图', 'Win + Shift + S'], ['显示桌面', 'Win + D'], ['锁定', 'Win + L'], ['切换输入法', 'Win + 空格']];
  return (
    <>
      <Group title="字符重复">
        <SettingRow icon={<Timer20Regular />} title="重复延迟" desc="按住按键多久之后开始重复"><Slider value={delay} onChange={setDelay} style={{ flex: '0 0 220px' }} /></SettingRow>
        <SettingRow icon={<Keyboard20Regular />} title="重复速度"><Slider value={rate} onChange={setRate} style={{ flex: '0 0 220px' }} /></SettingRow>
      </Group>
      <Group title="快捷键">
        {keys.map(([k, v]) => <SettingRow key={k} title={k}><span className="c-2 tnum">{v}</span></SettingRow>)}
      </Group>
    </>
  );
}

function PrintersPage() {
  const [managed, setManaged] = useState(true);
  return (
    <>
      <Group>
        <SettingRow icon={<Add16Regular style={{ width: 20, height: 20 }} />} title="添加打印机或扫描仪"><Button variant="accent" pill>添加设备</Button></SettingRow>
      </Group>
      <Group title="设备">
        <SettingRow icon={<Print20Regular />} title={<span className="row gap-8">Liber LaserJet M4 <Badge variant="tint">默认</Badge></span>} desc="空闲 · 网络打印机" chevron onClick={() => {}} />
        <SettingRow icon={<DocumentPdf20Regular />} title="打印为 PDF" desc="系统虚拟打印机" chevron onClick={() => {}} />
      </Group>
      <Group title="打印机首选项">
        <SettingRow icon={<Options20Regular />} title="让系统管理默认打印机" desc="默认打印机为你在当前位置最后使用的打印机"><Switch checked={managed} onChange={setManaged} /></SettingRow>
      </Group>
    </>
  );
}

/* ---------- 账户 ---------- */
function EmailPage() {
  return (
    <>
      <Group title="邮件、日历和联系人使用的账户">
        <SettingRow icon={<Mail20Regular />} title="earzu@liber.dev" desc="Liber 账户 · 邮件、日历、联系人"><Button>管理</Button></SettingRow>
        <SettingRow icon={<Add16Regular style={{ width: 20, height: 20 }} />} title="添加账户"><Button>添加账户</Button></SettingRow>
      </Group>
      <Group title="其他应用使用的账户">
        <div className="notif-empty">没有其他应用使用的账户</div>
      </Group>
    </>
  );
}

function FamilyPage() {
  return (
    <>
      <Group title="你的家庭">
        <SettingRow icon={<People20Regular />} title="添加家庭成员" desc="为孩子设置内容限制与屏幕使用时间"><Button>添加某人</Button></SettingRow>
      </Group>
      <Group title="其他用户">
        <SettingRow icon={<Person20Regular />} title="访客" desc="本地账户 · 标准用户"><Button>更改账户类型</Button><Button variant="subtle" icon={<Delete16Regular />}>删除</Button></SettingRow>
        <SettingRow icon={<Add16Regular style={{ width: 20, height: 20 }} />} title="添加其他用户"><Button>添加账户</Button></SettingRow>
      </Group>
    </>
  );
}

/* ---------- 隐私和安全 ---------- */
function SecurityPage() {
  const [scanning, setScanning] = useState(false);
  const areas: [ReactNode, string, string][] = [
    [<ShieldCheckmark20Regular />, '病毒和威胁防护', '实时防护已开启'],
    [<Person20Regular />, '账户保护', '已使用 PIN 与指纹登录'],
    [<WifiSettings20Regular />, '防火墙和网络保护', '专用网络 · 已开启'],
    [<WindowApps20Regular />, '应用和浏览器控制', '基于信誉的保护已开启'],
    [<ShieldLock20Regular />, '设备安全', '安全启动与内核隔离已开启'],
  ];
  return (
    <>
      <div className="card set-hero">
        <ShieldCheckmark20Regular style={{ width: 44, height: 44, color: 'var(--success)' }} />
        <div className="grow">
          <div className="t-subtitle">{scanning ? '正在快速扫描…' : '设备受到保护'}</div>
          <div className="c-2">上次扫描：今天 09:30 · 未发现威胁</div>
        </div>
        <Button variant="accent" pill disabled={scanning} onClick={() => { setScanning(true); setTimeout(() => setScanning(false), 2400); }}>快速扫描</Button>
      </div>
      <Group title="保护区域">
        {areas.map(([icon, t, d]) => <SettingRow key={t} icon={icon} title={t} desc={d}><Badge variant="success">无需操作</Badge></SettingRow>)}
      </Group>
    </>
  );
}

/* ---------- 系统更新 ---------- */
function HistoryPage() {
  return (
    <>
      <Group title="功能更新">
        <Expander icon={<History20Regular />} title="LiberNT 26.11" desc="于 2026/11/12 成功安装" defaultOpen>
          {specs([['内部版本', '26200.1742'], ['大小', '3.8 GB'], ['安装方式', '自动']])}
        </Expander>
        <SettingRow icon={<History20Regular />} title="LiberNT 26.05" desc="于 2026/5/20 成功安装" />
      </Group>
      <Group title="质量更新">
        <SettingRow icon={<ShieldCheckmark20Regular />} title="2026-11 累积更新" desc="于 2026/11/19 成功安装" />
        <SettingRow icon={<ShieldCheckmark20Regular />} title="安全智能更新" desc="于 2026/11/26 成功安装" />
      </Group>
      <Group title="相关设置">
        <SettingRow icon={<ArrowReset20Regular />} title="卸载更新"><Button>卸载</Button></SettingRow>
      </Group>
    </>
  );
}

function AdvancedPage({ open }: SubProps) {
  const [other, setOther] = useState(true);
  const [asap, setAsap] = useState(false);
  const [metered, setMetered] = useState(false);
  const [hours, setHours] = useState('8:00 – 23:00');
  return (
    <>
      <Group>
        <SettingRow icon={<ArrowDownload20Regular />} title="接收其他产品的更新" desc="更新 LiberNT 时同时更新驱动程序与系统组件"><Switch checked={other} onChange={setOther} /></SettingRow>
        <SettingRow icon={<Clock20Regular />} title="更新后尽快重启"><Switch checked={asap} onChange={setAsap} /></SettingRow>
        <SettingRow icon={<DataUsage20Regular />} title="按流量计费的连接时也下载更新"><Switch checked={metered} onChange={setMetered} /></SettingRow>
        <SettingRow icon={<Timer20Regular />} title="使用时段" desc="这段时间内不会自动重启"><Select value={hours} onChange={setHours} width={150} options={['8:00 – 23:00', '9:00 – 18:00', '自动调整']} /></SettingRow>
      </Group>
      <Group title="其他选项">
        <SettingRow icon={<Add16Regular style={{ width: 20, height: 20 }} />} title="可选更新" desc="驱动程序与功能体验包" chevron onClick={() => open('optional')} />
        <SettingRow icon={<Cloud20Regular />} title="传递优化" desc="从网络上的其他设备获取更新" chevron onClick={() => {}} />
      </Group>
    </>
  );
}

function OptionalUpdatesPage() {
  const [picked, setPicked] = useState<string[]>([]);
  const items = ['Liber Graphics 驱动程序 26.11.3', 'Liber Audio 驱动程序 2.4.0', 'LiberNT 功能体验包 1026.5'];
  const toggle = (it: string, v: boolean) => setPicked(p => (v ? [...p, it] : p.filter(x => x !== it)));
  return (
    <>
      <Group title="驱动程序与体验包">
        {items.map(it => <SettingRow key={it} title={<Checkbox checked={picked.includes(it)} onChange={v => toggle(it, v)}>{it}</Checkbox>} />)}
      </Group>
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
        <Button variant="accent" disabled={!picked.length}>下载并安装</Button>
      </div>
    </>
  );
}

/* ---------- 应用详情 ---------- */
function AppDetailPage({ seg }: SubProps) {
  const app = APPS[seg as AppId];
  const [bg, setBg] = useState('由系统优化');
  const [startup, setStartup] = useState(false);
  const user = useSys(s => s.userName);
  return (
    <>
      <div className="card set-hero">
        <img src={app.icon} width={48} height={48} alt="" />
        <div className="grow">
          <div className="t-subtitle">{app.name}</div>
          <div className="c-2">{app.builtin ? 'LiberNT 系统组件' : app.category}</div>
        </div>
      </div>
      <Group title="规格">
        {specs([['版本', '26.11.1042.0'], ['发行者', 'LiberNT'], ['安装者', user]])}
      </Group>
      <Group title="权限">
        <SettingRow icon={<Eye20Regular />} title="后台应用权限" desc="控制此应用能否在后台运行"><Select value={bg} onChange={setBg} width={150} options={['始终', '由系统优化', '从不']} /></SettingRow>
        <SettingRow icon={<Fingerprint20Regular />} title="登录时运行"><Switch checked={startup} onChange={setStartup} /></SettingRow>
      </Group>
      <Group title="重置">
        <SettingRow icon={<Wrench20Regular />} title="修复" desc="应用无法正常运行时尝试修复，数据不受影响"><Button>修复</Button></SettingRow>
        <SettingRow icon={<ArrowReset20Regular />} title="重置" desc="删除此应用的数据，包括首选项与登录信息"><Button>重置</Button></SettingRow>
        <SettingRow icon={<Info20Regular />} title="卸载" desc={app.builtin ? '系统组件无法卸载' : '卸载此应用及其设置'}><Button variant="danger" disabled={app.builtin}>卸载</Button></SettingRow>
      </Group>
    </>
  );
}

const SUB: Partial<Record<SettingsPageId, (seg: string) => Node | undefined>> = {
  network: table({ ethernet: { name: '以太网', Page: EthernetPage }, proxy: { name: '代理', Page: ProxyPage } }),
  bluetooth: table({ keyboard: { name: '键盘', Page: KeyboardPage }, printers: { name: '打印机和扫描仪', Page: PrintersPage } }),
  accounts: table({ email: { name: '电子邮件和账户', Page: EmailPage }, family: { name: '家庭和其他用户', Page: FamilyPage } }),
  privacy: table({ security: { name: '安全中心', Page: SecurityPage } }),
  update: table({
    history: { name: '更新历史记录', Page: HistoryPage },
    advanced: { name: '高级选项', Page: AdvancedPage, sub: table({ optional: { name: '可选更新', Page: OptionalUpdatesPage } }) },
  }),
  apps: seg => (seg in APPS ? { name: APPS[seg as AppId].name, Page: AppDetailPage } : undefined),
};

/** 把路径解析为各级次级页（不含一级页）；遇到不认识的段就停下 */
export function resolvePath(path: string[]): Node[] {
  const out: Node[] = [];
  let next = SUB[path[0] as SettingsPageId];
  for (const seg of path.slice(1)) {
    const n = next?.(seg);
    if (!n) break;
    out.push(n);
    next = n.sub;
  }
  return out;
}

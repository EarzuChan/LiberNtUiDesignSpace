import { useState } from 'react';
import { cmpText, matchText } from '@/i18n';
import { APPS } from '@/lib/apps';
import { useSys } from '@/lib/system';
import { Avatar, Badge, Button, Expander, InfoBar, SettingRow, Slider, Switch, TextField, openMenuAt } from '@/ui';
import {
  Add16Regular, Airplane20Regular, Bluetooth20Regular, Checkmark16Regular, CloudSync20Regular, Cursor20Regular, Fingerprint20Regular, Globe20Regular,
  Key20Regular, Keyboard20Regular, LockClosed16Regular, Mail20Regular, MoreHorizontal16Regular, Password20Regular, People20Regular, PlugConnected20Regular,
  Print20Regular, Router20Regular, Search16Regular, Shield20Regular, Wifi120Regular, Wifi220Regular, Wifi320Regular,
} from '@/ui/icons';
import type { PageProps } from './Settings';
import { Group, Select } from './parts';

const NETWORKS = [
  { name: 'LiberNT-5G', level: 1, secure: true },
  { name: 'LiberNT-2.4G', level: 1, secure: true },
  { name: 'Studio-Guest', level: 2, secure: false },
  { name: 'CMCC-Home-8F2A', level: 2, secure: true },
  { name: 'TP-LINK_Office', level: 3, secure: true },
];
const WifiIcon = [Wifi120Regular, Wifi120Regular, Wifi220Regular, Wifi320Regular];

export function NetworkPage() {
  const s = useSys();
  const [hotspot, setHotspot] = useState(false);
  const [vpn, setVpn] = useState(false);
  const online = s.wifi && !s.airplane;
  return (
    <>
      <div className="card set-hero">
        <div className="set-device">
          <span className="cc-orb" aria-pressed={online} style={{ width: 48, height: 48 }}><Wifi120Regular /></span>
          <div>
            <div className="t-subtitle">{online ? s.wifiNetwork : '未连接'}</div>
            <div className="c-2">{online ? '已连接，安全 · 5 GHz · 866 Mbps' : s.airplane ? '飞行模式已开启' : 'WLAN 已关闭'}</div>
          </div>
        </div>
        <div className="set-hero-tiles">
          <div className="set-tile"><div><div className="t-caption c-2">近 30 天数据用量</div><div className="t-body-strong tnum">48.6 GB</div></div></div>
        </div>
      </div>

      <Group>
        <Expander icon={<Wifi120Regular />} title="WLAN" desc="连接、管理已知网络" defaultOpen trailing={<span onClick={e => e.stopPropagation()}><Switch checked={online} onChange={v => s.set({ wifi: v, airplane: false })} /></span>}>
          {online ? NETWORKS.map(n => {
            const Icon = WifiIcon[n.level];
            const current = n.name === s.wifiNetwork;
            return (
              <SettingRow key={n.name} icon={<Icon />} title={n.name} desc={current ? '已连接，安全' : n.secure ? '安全' : '开放'} onClick={() => s.set({ wifiNetwork: n.name })}>
                {current ? <Checkmark16Regular className="c-accent" /> : n.secure && <LockClosed16Regular className="c-3" />}
              </SettingRow>
            );
          }) : <div className="notif-empty">打开 WLAN 以查看可用网络</div>}
        </Expander>
        <SettingRow icon={<PlugConnected20Regular />} title="以太网" desc="未连接" chevron onClick={() => {}} />
        <SettingRow icon={<Shield20Regular />} title="VPN" desc="添加、连接和管理 VPN">
          <Switch checked={vpn} onChange={setVpn} />
        </SettingRow>
        <SettingRow icon={<Router20Regular />} title="移动热点" desc="共享此设备的 Internet 连接">
          <Switch checked={hotspot} onChange={setHotspot} />
        </SettingRow>
        <SettingRow icon={<Airplane20Regular />} title="飞行模式" desc="停止所有无线通信">
          <Switch checked={s.airplane} onChange={v => s.set({ airplane: v })} />
        </SettingRow>
        <SettingRow icon={<Globe20Regular />} title="代理" desc="用于 WLAN 和以太网连接的代理服务器" chevron onClick={() => {}} />
      </Group>
    </>
  );
}

const DEVICES = [
  { name: 'Liber Buds Pro', kind: '音频', icon: '/icons/devices/headphones.svg', state: '已连接语音和音乐', battery: 82 },
  { name: 'Liber Mouse M3', kind: '鼠标', icon: '/icons/devices/mouse.svg', state: '已连接', battery: 64 },
  { name: 'Liber Keys 75', kind: '键盘', icon: '/icons/devices/keyboard.svg', state: '已配对', battery: undefined },
  { name: 'Liber Phone', kind: '手机', icon: '/icons/devices/phone.svg', state: '已配对', battery: undefined },
];

export function BluetoothPage() {
  const s = useSys();
  const [speed, setSpeed] = useState(60);
  const on = s.bluetooth && !s.airplane;
  return (
    <>
      <Group>
        <SettingRow icon={<Bluetooth20Regular />} title="蓝牙" desc={on ? `可被发现为“${s.deviceName}”` : '已关闭'}>
          <span className="c-2">{on ? '开' : '关'}</span>
          <Switch checked={on} onChange={v => s.set({ bluetooth: v, airplane: false })} />
        </SettingRow>
      </Group>
      <Group title="设备">
        {on ? DEVICES.map(d => (
          <SettingRow key={d.name} icon={<img src={d.icon} width={32} height={32} alt="" style={{ margin: '0 -6px' }} />} title={d.name} desc={`${d.kind} · ${d.state}`}>
            {d.battery !== undefined && <Badge variant={d.battery > 30 ? 'success' : 'caution'}>{d.battery}%</Badge>}
            <Button variant="subtle" iconOnly icon={<MoreHorizontal16Regular />} onClick={e => openMenuAt(e.currentTarget, [{ label: '断开连接' }, { label: '删除设备', danger: true }])} />
          </SettingRow>
        )) : <div className="notif-empty">打开蓝牙以查看已配对的设备</div>}
        <SettingRow title="添加设备" desc="蓝牙、无线显示器或扩展坞" icon={<Add16Regular style={{ width: 20, height: 20 }} />}>
          <Button variant="accent" pill disabled={!on}>添加设备</Button>
        </SettingRow>
      </Group>
      <Group title="输入与外设">
        <SettingRow icon={<Cursor20Regular />} title="鼠标指针速度">
          <Slider value={speed} onChange={setSpeed} style={{ flex: '0 0 220px' }} />
        </SettingRow>
        <SettingRow icon={<Keyboard20Regular />} title="键盘" desc="重复速度、快捷键" chevron onClick={() => {}} />
        <SettingRow icon={<Print20Regular />} title="打印机和扫描仪" desc="首选项、疑难解答" chevron onClick={() => {}} />
      </Group>
    </>
  );
}

export function AppsPage() {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('名称');
  const sizes = (i: number) => [412, 96.4, 28.1, 1.2 * 1024, 64.3, 233, 18.6, 742][i % 8];
  let apps = Object.values(APPS).filter(a => matchText(a.name, query.trim().toLowerCase())).map((a, i) => ({ ...a, mb: sizes(i), date: `2026/${(i % 11) + 1}/${((i * 7) % 27) + 1}` }));
  apps = sort === '大小' ? apps.sort((a, b) => b.mb - a.mb) : apps.sort((a, b) => cmpText(a.name, b.name));
  return (
    <>
      <div className="row gap-12" style={{ marginBottom: 12 }}>
        <TextField value={query} onChange={setQuery} clearable prefix={<Search16Regular />} placeholder="搜索应用" pill fieldStyle={{ flex: 1 }} />
        <span className="c-2">排序方式</span>
        <Select value={sort} onChange={setSort} options={['名称', '大小']} width={110} />
      </div>
      <div className="t-caption c-2" style={{ margin: '0 4px 8px' }}>找到 {apps.length} 个应用</div>
      <Group>
        {apps.map(a => (
          <SettingRow key={a.id} icon={<img src={a.icon} width={32} height={32} alt="" style={{ margin: '0 -6px' }} />} title={a.name} desc={`${a.builtin ? 'LiberNT 系统组件' : a.category} · ${a.date}`}>
            <span className="c-2 tnum">{a.mb >= 1024 ? `${(a.mb / 1024).toFixed(1)} GB` : `${a.mb} MB`}</span>
            <Button variant="subtle" iconOnly icon={<MoreHorizontal16Regular />} onClick={e => openMenuAt(e.currentTarget, [{ label: '高级选项' }, { label: '移动' }, { separator: true }, { label: '卸载', danger: true, disabled: a.builtin }])} />
          </SettingRow>
        ))}
      </Group>
    </>
  );
}

export function AccountsPage({ go }: PageProps) {
  const s = useSys();
  const [sync, setSync] = useState(true);
  return (
    <>
      <div className="card set-hero">
        <Avatar size={72} />
        <div className="grow">
          <div className="t-subtitle">{s.userName}</div>
          <div className="c-2">本地账户 · 管理员</div>
        </div>
        <TextField value={s.userName} onChange={v => s.set({ userName: v.slice(0, 16) })} placeholder="显示名称" fieldStyle={{ width: 180 }} />
      </div>
      <InfoBar severity="info" title="使用在线账户登录" action={<Button size="sm">登录</Button>}>在设备之间同步设置、文件和壁纸。</InfoBar>
      <Group title="账户设置">
        <Expander icon={<Key20Regular />} title="登录选项" desc="PIN、指纹、密码">
          <SettingRow icon={<Fingerprint20Regular />} title="指纹识别" desc="已设置 2 枚指纹"><Button>管理</Button></SettingRow>
          <SettingRow icon={<Password20Regular />} title="PIN" desc="用于登录和验证身份"><Button>更改</Button></SettingRow>
          <SettingRow icon={<Key20Regular />} title="密码" desc="上次更改：3 个月前"><Button>更改</Button></SettingRow>
        </Expander>
        <SettingRow icon={<Mail20Regular />} title="电子邮件和账户" desc="邮件、日历和联系人使用的账户" chevron onClick={() => {}} />
        <SettingRow icon={<People20Regular />} title="家庭和其他用户" desc="设备访问权限、工作或学校用户" chevron onClick={() => {}} />
        <SettingRow icon={<CloudSync20Regular />} title="同步设置" desc="主题、密码和语言首选项">
          <Switch checked={sync} onChange={setSync} />
        </SettingRow>
        <SettingRow icon={<Shield20Regular />} title="隐私和安全" desc="权限与安全中心" chevron onClick={() => go('privacy')} />
      </Group>
    </>
  );
}

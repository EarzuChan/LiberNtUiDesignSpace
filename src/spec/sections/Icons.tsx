import type { ComponentType } from 'react';
import { APPS } from '@/lib/apps';
import { NavItem } from '@/ui';
import {
  Add20Regular, Alert20Regular, Apps20Regular, ArrowClockwise20Regular, ArrowDownload20Regular, ArrowLeft20Regular, ArrowSync20Regular, Bluetooth20Regular,
  CalendarLtr20Regular, Checkmark20Regular, Cloud20Regular, Copy20Regular, Cut20Regular, Delete20Regular, Desktop20Regular, Dismiss20Regular, Document20Regular,
  Edit20Regular, Eye20Regular, Filter20Regular, Folder16Filled, Folder16Regular, Folder20Filled, Folder20Regular, Folder24Filled, Folder24Regular, Folder28Filled,
  Folder28Regular, Folder32Filled, Folder32Regular, Folder48Filled, Folder48Regular, Globe20Regular, Grid20Regular, Heart20Regular, Home20Filled, Home20Regular,
  Image20Regular, Info20Regular, Keyboard20Regular, Link20Regular, LockClosed20Regular, Mail20Regular, Mic20Regular, MoreHorizontal20Regular, Open20Regular,
  PaintBrush20Regular, Person20Regular, Pin20Regular, Play20Regular, Power20Regular, Search20Regular, Send20Regular, Settings20Filled, Settings20Regular,
  Share20Regular, Shield20Regular, Speaker220Regular, Star20Filled, Star20Regular, Tag20Regular, Video20Regular, Warning20Regular, Wifi120Regular, Window20Regular,
} from '@/ui/icons';
import { Kv, Section } from '../parts';

type Icon = ComponentType;
const SIZES: [number, Icon, Icon][] = [[16, Folder16Regular, Folder16Filled], [20, Folder20Regular, Folder20Filled], [24, Folder24Regular, Folder24Filled], [28, Folder28Regular, Folder28Filled], [32, Folder32Regular, Folder32Filled], [48, Folder48Regular, Folder48Filled]];
const COMMON: [string, Icon][] = [
  ['Home', Home20Regular], ['Search', Search20Regular], ['Settings', Settings20Regular], ['Person', Person20Regular], ['Folder', Folder20Regular], ['Document', Document20Regular],
  ['Image', Image20Regular], ['Video', Video20Regular], ['Add', Add20Regular], ['Dismiss', Dismiss20Regular], ['Checkmark', Checkmark20Regular], ['Edit', Edit20Regular],
  ['Delete', Delete20Regular], ['Copy', Copy20Regular], ['Cut', Cut20Regular], ['Share', Share20Regular], ['Open', Open20Regular], ['Link', Link20Regular],
  ['ArrowLeft', ArrowLeft20Regular], ['ArrowClockwise', ArrowClockwise20Regular], ['ArrowSync', ArrowSync20Regular], ['ArrowDownload', ArrowDownload20Regular], ['Filter', Filter20Regular], ['Grid', Grid20Regular],
  ['Wifi1', Wifi120Regular], ['Bluetooth', Bluetooth20Regular], ['Speaker2', Speaker220Regular], ['Mic', Mic20Regular], ['Keyboard', Keyboard20Regular], ['Desktop', Desktop20Regular],
  ['Window', Window20Regular], ['Apps', Apps20Regular], ['PaintBrush', PaintBrush20Regular], ['Globe', Globe20Regular], ['Cloud', Cloud20Regular], ['Mail', Mail20Regular],
  ['CalendarLtr', CalendarLtr20Regular], ['Alert', Alert20Regular], ['Star', Star20Regular], ['Heart', Heart20Regular], ['Pin', Pin20Regular], ['Tag', Tag20Regular],
  ['Eye', Eye20Regular], ['LockClosed', LockClosed20Regular], ['Shield', Shield20Regular], ['Info', Info20Regular], ['Warning', Warning20Regular], ['Play', Play20Regular],
  ['Send', Send20Regular], ['Power', Power20Regular], ['MoreHorizontal', MoreHorizontal20Regular],
];
const PLACES = ['folder', 'folder-documents', 'folder-downloads', 'folder-pictures', 'folder-music', 'folder-videos', 'folder-projects', 'desktop', 'home', 'network', 'trash', 'trash-full'];
const DEVICES = ['computer', 'laptop', 'ssd', 'drive', 'usb', 'phone', 'headphones', 'printer'];
const MIMES = ['text', 'markdown', 'image', 'audio', 'video', 'pdf', 'zip', 'word', 'excel', 'powerpoint', 'json', 'html', 'css', 'typescript', 'python', 'font', 'iso', 'exe'];

export function IconSection() {
  return (
    <Section id="icons" title="图标" lead="系统图标直接采用 Fluent System Icons；应用、位置与文件类型使用 Fluent 风格的彩色图标——自由轮廓、柔和渐变、轻微立体感。">
      <h3>系统图标</h3>
      <p>单色、跟随文字颜色。每个尺寸都是独立绘制的光学版本，线宽与细节各不相同，不要用一个尺寸缩放出另一个。默认使用 Regular（线性），Filled（填充）只用于表达「选中 / 激活」状态。</p>
      <div className="spec-grid" style={{ gridTemplateColumns: '1.3fr 1fr' }}>
        <div className="spec-panel">
          {(['Regular', 'Filled'] as const).map((kind, k) => (
            <div key={kind} className="icon-sizes">
              <span className="t-caption c-3" style={{ width: 56, alignSelf: 'center' }}>{kind}</span>
              {SIZES.map(([n, R, F]) => { const C = k ? F : R; return <div key={n}><C />{k === 1 && <span className="tnum">{n}</span>}</div>; })}
            </div>
          ))}
        </div>
        <div className="spec-panel col" style={{ gap: 2, justifyContent: 'center' }}>
          <NavItem icon={<Home20Regular />} label="未选中：Regular + 次要色" />
          <NavItem active icon={<Home20Regular />} iconActive={<Home20Filled />} label="选中：Filled + 强调色" />
          <NavItem icon={<Star20Regular />} label="收藏（未收藏）" trailing={<Star20Regular className="c-3" />} />
          <NavItem icon={<Settings20Regular />} label="收藏（已收藏）" trailing={<Star20Filled className="c-accent" />} />
          <span style={{ display: 'none' }}><Settings20Filled /></span>
        </div>
      </div>
      <h4>常用图标（20 Regular）</h4>
      <div className="spec-panel">
        <div className="icon-grid">{COMMON.map(([name, C]) => <div key={name} className="icon-cell"><C />{name}</div>)}</div>
      </div>
      <p className="spec-note" style={{ marginTop: 12 }}>从 <Kv>@/ui/icons</Kv> 按 <Kv>名称 + 尺寸 + 样式</Kv> 引入，例如 <Kv>Folder20Regular</Kv>。新增图标组：编辑 <Kv>scripts/gen-icons.mjs</Kv> 后重新生成。</p>

      <h3>应用图标</h3>
      <p>不套统一底板，各自保留可辨识的轮廓。标准显示尺寸：Dock 36、开始菜单 40、桌面 52、列表 20–32。</p>
      <div className="spec-panel">
        <div className="app-icons">{Object.values(APPS).map(a => <div key={a.id}><img src={a.icon} alt="" /><span className="ellipsis" style={{ maxWidth: 84 }}>{a.name}</span></div>)}</div>
      </div>
      <h3>位置、设备与文件类型</h3>
      <div className="spec-panel">
        <div className="app-icons">
          {PLACES.map(n => <div key={n}><img src={`/icons/places/${n}.svg`} alt="" /><span className="spec-code">{n}</span></div>)}
          {DEVICES.map(n => <div key={n}><img src={`/icons/devices/${n}.svg`} alt="" /><span className="spec-code">{n}</span></div>)}
          {MIMES.map(n => <div key={n}><img src={`/icons/mimetypes/${n}.svg`} alt="" /><span className="spec-code">{n}</span></div>)}
        </div>
      </div>
    </Section>
  );
}

import { APPS, type AppId } from '@/lib/apps';
import { useSys } from '@/lib/system';
import { resolveWallpaper } from '@/lib/wallpapers';
import { Button, Glass, NavItem } from '@/ui';
import { Logo } from '@/ui/Logo';
import { Desktop16Regular, Dismiss16Regular, Search24Regular, Square16Regular, Subtract16Regular } from '@/ui/icons';
import { Section } from '../parts';

const SIDE: [string, string][] = [['home', '主页'], ['desktop', '桌面'], ['folder-documents', '文档'], ['folder-pictures', '图片'], ['folder-downloads', '下载']];
const DOCK: [AppId, boolean, boolean][] = [['files', true, true], ['edge', true, false], ['photos', false, false], ['notepad', false, false], ['settings', true, false]];
const BEHAVIOR = [
  ['拖拽', '按住标题区任意空白处拖动；窗口至少保留 80px 在屏幕内，标题栏不会越过工作区顶部。'],
  ['贴靠', '拖到左/右边缘贴靠半屏，靠近上下四分之一处贴靠四分之一屏，拖到顶边最大化。松手前显示玻璃预览。从贴靠状态拖出时恢复原尺寸。'],
  ['最大化', '双击标题区或点击最大化按钮。窗口圆角归零，悬浮的 Dock 与托盘收拢为通栏底板。'],
  ['最小化', '窗口缩入 Dock 上对应的图标；再次点击图标还原。点击已聚焦应用的图标则最小化。'],
  ['任务栏预览', '悬停在运行中的应用上片刻，图标上方浮出一块单层面板，各窗口的标题与缩略图（悬停那一刻的静态快照，最小化的窗口也有）直接并排其上。缩略图之间的间隙是共用的：悬停哪个窗口，哪一列就整列提亮并占满间隙。点击切到该窗口，右上角可直接关闭；预览打开后在图标间移动即时切换。'],
  ['多窗口', '应用有两个及以上窗口时，它在前台或被悬停时底板后面再垫一张（悬停时淡一些），不论窗口多少只叠两层。圆形底板的月牙露在圆外；方形底板的层叠收在图标格内，图标位置不动。'],
  ['调整大小', '八个方向的隐形手柄，向外溢出 5px。每个应用声明最小尺寸。'],
  ['失焦', '阴影由 64 降为较浅的一级，标题与控制按钮降为三级文字色；材质保持不变。'],
];

export function ShellSection() {
  const theme = useSys(s => s.theme);
  useSys(s => s.wallpaperRev);
  const url = resolveWallpaper(useSys(s => s.wallpaper), theme).url;
  const bl = theme === 'dark' ? 0.35 : 0.6;
  return (
    <Section id="shell" title="窗口与外壳" lead="窗口由云母玻璃底板与实色内容面板两层构成：侧栏与标题区透出模糊后的桌面，内容区保持稳定的实色以保证阅读。任务栏默认是悬浮的玻璃胶囊 Dock（可改为圆角矩形），也可在设置中切换为贴底通栏的经典任务栏，两者都支持居中或靠左。">
      <h3>解剖</h3>
      <div className="anatomy">
        <img src={url} alt="" />
        <div style={{ position: 'relative' }}>
          <Glass thickness="mica" fixedLuma={bl} className="anatomy-win" noise>
            <aside className="app-sidebar" style={{ width: 190 }}>
              <div className="set-side-head"><img src={APPS.files.icon} width={20} height={20} alt="" />文件</div>
              <div className="col" style={{ gap: 2, padding: '0 8px' }}>
                {SIDE.map(([icon, label], i) => <NavItem key={icon} active={i === 2} icon={<img src={`/icons/places/${icon}.svg`} width={20} height={20} alt="" />} label={label} />)}
              </div>
            </aside>
            <section className="app-pane">
              <div className="row chrome-bar" style={{ height: 52, paddingLeft: 16 }}>
                <span className="t-body-strong">文档</span>
                <div className="caption">
                  <span className="caption-btn"><Subtract16Regular /></span><span className="caption-btn"><Square16Regular /></span><span className="caption-btn"><Dismiss16Regular /></span>
                </div>
              </div>
              <div className="files-grid" style={{ padding: '0 12px' }}>
                {['folder', 'folder', 'folder-documents'].map((n, i) => <div key={i} className="fitem fitem-grid"><img src={`/icons/places/${n}.svg`} alt="" /><span>{['工作', '读书笔记', '归档'][i]}</span></div>)}
                {['word', 'pdf', 'excel'].map(n => <div key={n} className="fitem fitem-grid" aria-selected={n === 'pdf'}><img src={`/icons/mimetypes/${n}.svg`} alt="" /><span>{n === 'pdf' ? '合同.pdf' : n === 'word' ? '总结.docx' : '预算.xlsx'}</span></div>)}
              </div>
            </section>
          </Glass>
          <span className="callout" style={{ left: -34, top: -12 }}>圆角 12</span>
          <span className="callout" style={{ left: -70, top: 262 }}>侧栏 · 云母玻璃 · 宽 248</span>
          <span className="callout" style={{ left: 250, top: -12 }}>标题区 52 · 可拖拽</span>
          <span className="callout" style={{ right: -58, top: 40 }}>控制按钮 40×32 · 沿中线对齐</span>
          <span className="callout" style={{ right: -40, top: 240 }}>内容面板 · --surface-pane</span>
          <span className="callout" style={{ left: 220, bottom: -12 }}>阴影 64 · 发丝线 + 内沿高光</span>
        </div>
        <div style={{ position: 'relative' }}>
          <Glass thickness="regular" fixedLuma={bl} className="anatomy-dock" noise>
            <span className="dock-btn" data-open><Logo size={30} /></span>
            <span className="dock-btn dock-search"><Search24Regular /></span>
            <span className="dock-sep" />
            {DOCK.map(([id, running, active]) => <span key={id} className="dock-btn" data-running={running} data-active={active} data-multi={active}><img src={APPS[id].icon} alt="" /></span>)}
          </Glass>
          <span className="callout" style={{ left: -96, top: 44 }}>高 60 · 胶囊</span>
          <span className="callout" style={{ left: 20, bottom: -22 }}>图标格 48 · 悬停底为正圆</span>
          <span className="callout" style={{ right: -150, top: 44 }}>运行指示 · 5px 圆点</span>
          <span className="callout" style={{ right: 30, bottom: -22 }}>图标 36</span>
        </div>
      </div>

      <h3>窗口行为</h3>
      <div className="spec-panel" style={{ padding: '8px 12px' }}>
        <table className="spec-table">
          <tbody>{BEHAVIOR.map(([k, v]) => <tr key={k}><td className="t-body-strong" style={{ width: 90 }}>{k}</td><td className="c-2">{v}</td></tr>)}</tbody>
        </table>
      </div>

      <h3>在桌面中查看</h3>
      <p>以上所有 token 与控件都在桌面 Demo 中实际使用：可拖拽缩放的窗口、开始菜单、控制中心、通知与日历、文件管理器、设置、锁屏。</p>
      <Button variant="accent" size="lg" icon={<Desktop16Regular />} onClick={() => (location.href = '/')}>打开桌面 Demo</Button>
    </Section>
  );
}

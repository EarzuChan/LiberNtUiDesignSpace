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
  ['贴靠', '拖到左/右边缘贴靠半屏，靠近上下四分之一处贴靠四分之一屏，拖到顶边最大化。松手前显示玻璃预览。贴靠后圆角归零、去掉投影，只留 1px 内沿描边作为相邻窗口的接缝。从贴靠状态拖出时恢复原尺寸。'],
  ['最大化', '双击标题区或点击最大化按钮。窗口圆角归零，边缘高光与投影淡出，控制按钮的命中区延伸到屏幕顶边与右边；底部遮罩换成通栏底板，Dock 主岛的底色、模糊与边缘随之消融。'],
  ['最小化', '窗口缩入 Dock 上对应的图标；再次点击图标还原。点击已聚焦应用的图标则最小化。'],
  ['悬停与选中', '圆角矩形 Dock 与经典任务栏不绘制图标外框；悬停改为一团微弱的圆形光，前台状态只由底部宽舌片表达。胶囊 Dock 仍使用提亮底板。'],
  ['运行指示', '胶囊 Dock 中为 5px 圆点；圆角矩形 Dock 与经典任务栏中为高 3px 的上圆角舌片。运行中宽 8px；前台使用强调色，宽度与图标相同（圆角矩形 Dock 36px，经典任务栏 26px）；舌片底边与容器底边齐平，在圆角矩形 Dock 中压住下沿高光。'],
  ['开始菜单激活', '开始菜单打开期间接管任务栏激活态，原前台应用退回运行中，关闭后自动还原；方形模式中开始按钮显示前台舌片，胶囊 Dock 中沿用打开底板。'],
  ['任务栏预览', '悬停在运行中的应用上片刻，图标上方浮出一块单层面板，各窗口的标题与缩略图（悬停那一刻的静态快照，最小化的窗口也有）直接并排其上。缩略图之间的间隙是共用的：悬停哪个窗口，哪一列就整列提亮并占满间隙。点击切到该窗口，右上角可直接关闭；预览打开后在图标间移动即时切换。'],
  ['多窗口', '应用有两个及以上窗口时，胶囊 Dock 中它在前台或被悬停时底板后面再垫一张（悬停时淡一些），不论窗口多少只叠两层，月牙露在圆外；圆角矩形 Dock 与经典任务栏不使用层叠底板。'],
  ['调整大小', '八个方向的隐形手柄，向外溢出 5px。每个应用声明最小尺寸。'],
  ['失焦', '阴影由 64 降为较浅的一级，标题与控制按钮降为三级文字色；材质保持不变。'],
  ['窗口边缘', '窗口外沿是一圈画在窗口之外的 1px 描边，不压内容；顶边一道倒角高光留在内侧，绘制在内容层之上。贴靠时改为 1px 内沿描边作接缝，最大化时全部淡出。'],
];

export function ShellSection() {
  const theme = useSys(s => s.theme);
  useSys(s => s.wallpaperRev);
  const url = resolveWallpaper(useSys(s => s.wallpaper), theme).url;
  const bl = theme === 'dark' ? 0.35 : 0.6;
  return (
    <Section id="shell" title="窗口与外壳" lead="窗口由独立的边缘高光、云母玻璃底板与实色内容面板构成：边缘高光始终位于内容之上，侧栏与标题区透出模糊后的桌面，内容区保持稳定的实色以保证阅读。任务栏默认是悬浮的玻璃胶囊 Dock（可改为圆角矩形），也可在设置中切换为贴底通栏的经典任务栏，两者都支持居中或靠左。">
      <h3>解剖</h3>
      <div className="anatomy">
        <img src={url} alt="" />
        <div style={{ position: 'relative' }}>
          <Glass thickness="mica" edge={false} fixedLuma={bl} className="anatomy-win" noise>
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
            <i className="win-edge" aria-hidden />
          </Glass>
          <span className="callout" style={{ left: -34, top: -12 }}>圆角 12</span>
          <span className="callout" style={{ left: -70, top: 262 }}>侧栏 · 云母玻璃 · 宽 248</span>
          <span className="callout" style={{ left: 250, top: -12 }}>标题区 52 · 可拖拽</span>
          <span className="callout" style={{ right: -58, top: 40 }}>控制按钮 40×32 · 沿中线对齐</span>
          <span className="callout" style={{ right: -40, top: 240 }}>内容面板 · --surface-pane</span>
          <span className="callout" style={{ left: 220, bottom: -12 }}>阴影 64 · 窗口边缘高光</span>
        </div>
        <div style={{ position: 'relative' }}>
          <Glass thickness="regular" fixedLuma={bl} className="anatomy-dock" noise>
            <span className="dock-btn" data-open><Logo size={30} /></span>
            <span className="dock-btn dock-search"><Search24Regular /></span>
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

import { useEffect, useRef, useState } from 'react';
import { useSys } from '@/lib/system';
import { Kv, Section } from '../parts';

const TIERS: [string, string, string, string, string, string][] = [
  ['T0', '帧缓冲', '固件帧缓冲、单线程软光栅，没有合成器', '启动画面、启动菜单、蓝屏、恢复环境', '实色与静态半透明面、圆角、发丝线、整屏淡入淡出、小区域动画、预烘焙的模糊背景', '实时模糊、阴影、高光边、噪点、弹簧、壁纸取色'],
  ['T1', '基础合成', '内核已启动，没有完整外壳', '安全模式、远程会话、关闭透明效果时的回退', 'T0 的全部，加上透明度与位移动画', '自适应玻璃'],
  ['T2', '安全桌面', '完整合成，位于用户会话之外', '锁屏、登录、关机、凭据提示', '全套材质；元素少、节奏慢', '—'],
  ['T3', '会话', '用户桌面', '窗口、任务栏、浮层、应用', '全部', '—'],
];
const T0_RULES: [string, string][] = [
  ['颜色', '只有暗色。强调色固定为品牌蓝，不随壁纸变化；文字用不透明色。启动画面是纯黑，蓝屏是深墨蓝，其余是墨色底加预烘焙背景。'],
  ['表面', '实色或静态半透明，只合成一次。层级靠明度台阶与发丝线表达，不用阴影、高光边和噪点。'],
  ['模糊', '不做实时模糊。背景是构建时烘焙好的位图：把壁纸缩小再放大，映射到品牌色相的双色调，最后叠一层固定噪点消除色带。'],
  ['字体', '2 个字重（400 / 600）、4 个字号（14 / 16 / 28 / 40）。等宽字体只用于代码与命令行。'],
  ['选中', '没有独立的悬停态：指针移到哪里，选中就到哪里。唯一的强调是实色强调填充，按 Enter 确认。'],
  ['动效', '整屏淡入淡出，加上小区域动画（进度条、标志扣合）。不用弹簧。'],
  ['圆角', '角色与桌面相同：卡片 8，成组的行外角 10、内角 3，按键提示 4。'],
];
const T2_RULES: [string, string][] = [
  ['主题', '始终按暗色处理，与系统的亮 / 暗设置无关；从这里弹出的菜单和提示也用暗色。'],
  ['背景', '用户的壁纸。锁屏只加一层极轻的压暗，以及时钟和底部提示背后的渐变；登录、关机时整屏模糊。压暗的强度随壁纸亮度变化，保证白字可读。'],
  ['材质', '锁屏上直接叠在壁纸上的只有文字和两处真玻璃（通知胶囊、角落按钮组）。整屏模糊之后相当于一整块玻璃，其上的控件用「玻璃上的项目」那组填充，不再叠玻璃。'],
  ['动效', '比桌面慢一档（300–700ms）。壁纸、压暗层、文字和玻璃各自过渡；容器不做透明度动画，否则其中的玻璃会失效。'],
  ['会话', '锁定和睡眠不结束会话，解锁后窗口原样保留。注销、重启、关机会结束会话；有未保存的更改时先列出阻止的应用。'],
];

/** 场景卡片：页面、缩略图的附加参数、名称、说明、同一页面的其他状态 */
interface Scene { page: string; query?: string; preview?: string; name: string; desc: string; more?: [label: string, query: string][] }
const T0_SCENES: Scene[] = [
  { page: 'boot', name: '启动画面', desc: '纯黑底上的标志与一条细进度条。标志的两个直角扣合之后，整个启动过程中保持不动。', more: [['安装更新', 'mode=update'], ['检查磁盘', 'mode=check'], ['从休眠恢复', 'mode=resume'], ['自动修复', 'mode=repair'], ['安全模式', 'mode=safe']] },
  { page: 'bootmenu', preview: 'timeout=0', name: '启动菜单', desc: '键盘优先的成组行，默认项底边带倒计时线；按 F8 进入高级启动选项。' },
  { page: 'bugcheck', name: '蓝屏', desc: '深墨蓝实色底。左对齐的排版层级：一句人话、进度、技术卡片。' },
  { page: 'recovery', name: '恢复环境', desc: '「继续启动」加一组修复工具磁贴；工具页依次是选项、进度、结果。' },
];
const T2_SCENES: Scene[] = [
  { page: 'loginui', name: '锁屏', desc: '时钟是主角，下面一行一瞥信息，底部是通知摘要。点击屏幕或按任意键进入登录。', more: [['睡眠', 'phase=sleep'], ['熄屏', 'phase=off']] },
  { page: 'loginui', query: 'phase=login', name: '登录', desc: 'PIN、密码、指纹三种方式。左下角切换用户，右下角是输入法、网络、辅助功能和电源。', more: [['欢迎', 'phase=welcome']] },
  { page: 'loginui', query: 'phase=shutdown', name: '关机', desc: '注销、重启、关机共用同一版式：一句状态加进度环，结束后熄屏并衔接下一个场景。', more: [['注销', 'phase=signout'], ['重启', 'phase=restart'], ['更新并重启', 'phase=update']] },
  { page: 'loginui', query: 'phase=blocked', name: '应用阻止关机', desc: '有未保存的更改时，先列出阻止的应用；可以取消，也可以强制继续。' },
];

/** 场景页的实时缩略图：按容器宽度等比缩放一个 1280×720 的 iframe */
function Preview({ href, src, title }: { href: string; src: string; title: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const el = ref.current!;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / 1280));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <a className="scene-view" ref={ref} href={href}>
      {scale > 0 && <iframe src={src} title={title} loading="lazy" tabIndex={-1} style={{ transform: `scale(${scale})` }} />}
    </a>
  );
}

function SceneGrid({ scenes }: { scenes: Scene[] }) {
  // 语言和主题写进缩略图的网址：切换时让 iframe 重新加载
  const lang = useSys(s => s.lang);
  const theme = useSys(s => s.theme);
  return (
    <div className="scene-grid">
      {scenes.map(s => {
        const href = `/${s.page}.html${s.query ? `?${s.query}` : ''}`;
        return (
          <div key={href} className="scene-card">
            <Preview href={href} src={`/${s.page}.html?${[s.query, s.preview, `lang=${lang}`, `theme=${theme}`].filter(Boolean).join('&')}`} title={s.name} />
            <div className="scene-meta">
              <div className="row gap-8"><b className="t-body-strong">{s.name}</b><a className="spec-code" href={href}>{href}</a></div>
              <p className="t-caption c-2">{s.desc}</p>
              {s.more && <p className="t-caption c-2 scene-links"><span>其他状态</span>{s.more.map(([label, q]) => <a key={q} href={`/${s.page}.html?${q}`}>{label}</a>)}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const RuleTable = ({ rows }: { rows: [string, string][] }) => (
  <div className="spec-panel" style={{ padding: '8px 12px' }}>
    <table className="spec-table">
      <tbody>{rows.map(([k, v]) => <tr key={k}><td className="t-body-strong" style={{ width: 90 }}>{k}</td><td className="c-2">{v}</td></tr>)}</tbody>
    </table>
  </div>
);

export function ScenesSection() {
  return (
    <Section id="scenes" title="系统场景" lead="桌面之外的系统界面按当时可用的渲染能力分层。越靠近开机，能用的效果越少；但圆角角色、间距、字阶始终是同一套，所以看起来仍是同一个系统。">
      <h3>保真度阶梯</h3>
      <p>每个场景归入一层，只使用该层允许的效果。T0 的四个场景和 T2 的登录界面各有独立页面；T1 尚未单独成页。</p>
      <div className="spec-panel" style={{ padding: '8px 12px' }}>
        <table className="spec-table">
          <thead><tr><th style={{ width: 110 }}>层</th><th style={{ width: 170 }}>环境</th><th style={{ width: 190 }}>场景</th><th>允许</th><th style={{ width: 190 }}>不用</th></tr></thead>
          <tbody>
            {TIERS.map(([id, name, env, scenes, allow, deny]) => (
              <tr key={id}>
                <td><div className="t-body-strong">{id}</div><div className="t-caption c-2">{name}</div></td>
                <td className="t-caption c-2">{env}</td>
                <td className="t-caption">{scenes}</td>
                <td className="t-caption c-2">{allow}</td>
                <td className="t-caption c-2">{deny}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>T0 · 帧缓冲层</h3>
      <p>设计系统的严格子集，定义在 <Kv>src/lite/lite.css</Kv>，作用域是 <Kv>data-tier="lite"</Kv>。这些页面不加载材质样式，所以玻璃效果在这里根本不可用。</p>
      <RuleTable rows={T0_RULES} />
      <h4>场景页面</h4>
      <SceneGrid scenes={T0_SCENES} />

      <h3>T2 · 安全桌面</h3>
      <p>锁屏、登录、睡眠，以及注销、重启、关机，都在 <Kv>/loginui.html</Kv>，用 <Kv>?phase=</Kv> 直接打开某个阶段。桌面里的锁定和睡眠嵌入的是同一个界面，盖在会话之上。</p>
      <RuleTable rows={T2_RULES} />
      <h4>场景页面</h4>
      <SceneGrid scenes={T2_SCENES} />

      <p className="spec-note" style={{ marginTop: 16 }}>
        直接打开时场景停在原地，便于审阅；带 <Kv>?flow</Kv> 时会自动衔接下一个场景。桌面里「开始 → 电源」的各项会走完整流程：重启依次经过关机、启动画面、锁屏；终端里输入 <Kv>bugcheck</Kv> 会触发蓝屏。
      </p>
    </Section>
  );
}

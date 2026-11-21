import { Button, SettingRow } from '@/ui';
import {
  ArrowDownload16Regular, ArrowLeft16Regular, ArrowRight16Regular, MusicNote220Regular, Person20Regular, Play16Filled, Settings16Regular, Settings20Regular,
  Settings24Regular, Settings32Regular, Settings48Regular, Star20Regular, TextBulletList20Regular,
} from '@/ui/icons';
import { Kv, Pair, Section } from '../parts';

const TYPE: [string, string, string, string, string][] = [
  ['Display', 't-display', '68 / 88 · 600', '18:42', '锁屏时钟等超大数字'],
  ['Title Large', 't-title-large', '40 / 52 · 600', '轻盈通透 LiberNT', '规范页、欢迎页主标题'],
  ['Title', 't-title', '28 / 36 · 600', '轻盈通透 LiberNT 26', '应用内页面标题'],
  ['Subtitle', 't-subtitle', '20 / 28 · 600', '轻盈通透 LiberNT 26', '分区标题、对话框标题'],
  ['Body Large', 't-body-large', '16 / 24 · 400', '轻盈通透，内容优先 LiberNT 26.11', '导语、强调段落'],
  ['Body Strong', 't-body-strong', '14 / 20 · 600', '轻盈通透，内容优先 LiberNT 26.11', '分组标题、列表主标题'],
  ['Body', 't-body', '14 / 20 · 400', '轻盈通透，内容优先 LiberNT 26.11', '默认正文与控件文字'],
  ['Caption', 't-caption', '12 / 16 · 400', '轻盈通透，内容优先 LiberNT 26.11', '辅助说明、时间戳、状态栏'],
];

export function TypeSection() {
  return (
    <Section id="type" title="字体" lead="使用系统字体栈：西文与数字为 Segoe UI Variable（按字号自动切换光学尺寸），中文为微软雅黑 UI。只用 400 与 600 两档字重，层级主要靠字号与颜色拉开。">
      <h3>字体族</h3>
      <div className="spec-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          ['--font-ui', '界面', 'var(--font-ui)', 'Segoe UI Variable · 微软雅黑 UI'],
          ['--font-display', '标题与大数字', 'var(--font-display)', 'Segoe UI Variable Display'],
          ['--font-mono', '等宽', 'var(--font-mono)', 'Cascadia Code · Consolas'],
        ].map(([token, label, family, desc]) => (
          <div key={token} className="spec-panel">
            <div style={{ font: `600 40px/48px ${family}` }}>Aa 永 123</div>
            <div className="t-body-strong" style={{ marginTop: 12 }}>{label}</div>
            <div className="t-caption c-2">{desc}</div>
            <div className="spec-code" style={{ marginTop: 6 }}>{token}</div>
          </div>
        ))}
      </div>
      <h3>字阶</h3>
      <p>规格写作「字号 / 行高 · 字重」。数字默认比例宽度，需要对齐时加 <Kv>.tnum</Kv>。大字号收紧字距（-1% ~ -2%）。</p>
      <div className="spec-panel" style={{ padding: '8px 12px' }}>
        <table className="spec-table">
          <thead><tr><th style={{ width: 110 }}>名称</th><th>示例</th><th style={{ width: 130 }}>规格</th><th style={{ width: 190 }}>用途</th></tr></thead>
          <tbody>
            {TYPE.map(([name, cls, spec, sample, use]) => (
              <tr key={name}>
                <td><div className="t-body-strong">{name}</div><div className="spec-code">.{cls}</div></td>
                <td><div className={`${cls} ellipsis`} style={{ maxWidth: 520 }}>{sample}</div></td>
                <td className="spec-code">{spec}</td>
                <td className="t-caption c-2">{use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

const SPACE: [number, string][] = [
  [2, '描边与填充之间的微调'], [4, '图标与文字、紧凑列表项间距'], [6, '半步：小控件内边距'], [8, '控件内元素间距、卡片网格间距'], [12, '控件水平内边距、浮层内边距'],
  [16, '卡片内边距、设置行内边距'], [20, '大卡片内边距'], [24, '分组之间、对话框内边距'], [32, '页面水平边距（窄）'], [40, '页面水平边距（宽）'], [48, '大区块之间'], [64, '章节之间'],
];
const METRICS: [string, string, string][] = [
  ['任务栏占位高度', '76 / 48', '--taskbar-h：悬浮 Dock / 经典任务栏；最大化窗口为其留出空间'], ['经典任务栏', '48', '贴底通栏；图标格 40（圆角 4），图标 26；可居中或靠左'], ['Dock 高度', '60', '默认胶囊外形；图标格 48（悬停底为正圆），图标 36'], ['托盘高度', '48', '胶囊，与 Dock 中线对齐'],
  ['窗口圆角', '8', '最大化时为 0'], ['标题栏高度', '40 / 52', '标准 / 与工具栏合并'], ['窗口控制按钮', '40 × 28 / 40 × 32', '标准标题栏 / 合并工具栏（与控件同高）；沿标题区垂直中线对齐，圆角 4'], ['侧栏宽度', '248', '玻璃底板，列表项高 34–38'],
  ['浮层圆角', '20', '开始菜单、控制中心、通知'], ['菜单', '最小宽 200', '圆角 8，菜单项高 32、圆角 4'], ['设置行最小高度', '64', '展开子项 48；分组内行间隙 2，外角 10、内角 3'],
];

export function SpacingSection() {
  return (
    <Section id="spacing" title="间距与尺寸" lead="4px 栅格，2 与 6 作为半步用于小控件内部。间距 token 只表达数值，语义由组件决定。">
      <h3>间距标尺</h3>
      <div className="spec-panel">
        {SPACE.map(([n, use]) => (
          <div key={n} className="scale-row">
            <span className="spec-code">--space-{n}</span>
            <span className="t-body-strong tnum">{n}px</span>
            <span className="row gap-12"><i className="scale-bar" style={{ width: n * 4 }} /><span className="t-caption c-2">{use}</span></span>
          </div>
        ))}
      </div>
      <h3>控件与图标尺寸</h3>
      <div className="spec-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="spec-panel">
          <div className="size-demo">
            <div className="col gap-8"><Button size="sm">小 24</Button><span className="spec-code">--control-sm</span></div>
            <div className="col gap-8"><Button>标准 32</Button><span className="spec-code">--control-md</span></div>
            <div className="col gap-8"><Button size="lg">大 40</Button><span className="spec-code">--control-lg</span></div>
          </div>
          <p className="t-caption c-2" style={{ marginTop: 14 }}>默认 32；工具条内的次要按钮与标签用 24；页面主操作用 40。</p>
        </div>
        <div className="spec-panel">
          <div className="size-demo">
            {[[16, <Settings16Regular />], [20, <Settings20Regular />], [24, <Settings24Regular />], [32, <Settings32Regular />], [48, <Settings48Regular />]].map(([n, icon]) => (
              <div key={n as number} className="col gap-8" style={{ alignItems: 'center' }}>{icon}<span className="spec-code">{n as number}</span></div>
            ))}
          </div>
          <p className="t-caption c-2" style={{ marginTop: 14 }}>16 用于菜单与工具条，20 用于导航与设置行，24 以上用于空状态与磁贴。</p>
        </div>
      </div>
      <h3>外壳关键尺寸</h3>
      <div className="spec-panel" style={{ padding: '8px 12px' }}>
        <table className="spec-table">
          <thead><tr><th>项目</th><th style={{ width: 140 }}>数值（px）</th><th>说明</th></tr></thead>
          <tbody>{METRICS.map(([a, b, c]) => <tr key={a}><td>{a}</td><td className="t-body-strong tnum">{b}</td><td className="t-caption c-2">{c}</td></tr>)}</tbody>
        </table>
      </div>
    </Section>
  );
}

const ROLES: { name: string; range: string; desc: string; items: [string, number | string, string][] }[] = [
  {
    name: '结构', range: '4 – 8', desc: '窗口、面板、卡片、列表行、表单控件。它们是内容的骨架，圆角只负责柔化，不抢戏。',
    items: [['--radius-control', 4, '按钮、输入框、菜单项、窗口三键'], ['--radius-item', 5, '导航项、文件项'], ['--radius-6', 6, '大按钮、提示、缩略图'], ['--radius-card / menu / window', 8, '卡片、菜单、窗口、对话框']],
  },
  {
    name: '悬浮', range: '16 – 20', desc: '浮在桌面之上的独立表面：开始菜单、控制中心、通知、桌面小组件。大圆角让它们读作「另一层」。',
    items: [['--radius-16', 16, '任务栏（圆角矩形外形）'], ['--radius-flyout', 20, '浮层、小组件']],
  },
  {
    name: '灵动', range: '全圆', desc: '可拨弄的小物件：搜索框、开关、复选框、分段控件、标签、圆形图标按钮、独立主操作、Dock。把圆角推到另一极，为 Fluent 的方正加一点活泼。',
    items: [['--radius-pill', '999', '胶囊与圆形']],
  },
];

export function RadiusSection() {
  return (
    <Section id="radius" title="圆角" lead="圆角按角色分两极，而不是随尺寸递增：结构性的表面用小圆角，可拨弄的小物件用全圆；10–14 的中间档基本不用——不大不小的圆角最显廉价。">
      <div className="spec-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 28 }}>
        {ROLES.map(role => (
          <div key={role.name} className="spec-panel">
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}><span className="t-subtitle">{role.name}</span><span className="t-body-strong c-accent tnum">{role.range}</span></div>
            <p className="t-caption c-2" style={{ margin: '6px 0 16px', lineHeight: '18px', minHeight: 54 }}>{role.desc}</p>
            <div className="col gap-12">
              {role.items.map(([token, r, use]) => (
                <div key={token} className="row gap-12">
                  <div className="radius-box" style={{ width: 56, height: 40, flex: 'none', borderRadius: r === '999' ? 999 : `${r}px`, borderColor: 'var(--accent)' }} />
                  <div><div className="t-body-strong tnum">{r === '999' ? '全圆' : `${r}px`}　<span className="spec-code">{token}</span></div><div className="t-caption c-2">{use}</div></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <h3>胶囊用在哪</h3>
      <p>胶囊费横向空间，也容易显得像移动端，所以限定场景：独立的主操作、媒体控制、工具栏里的圆形图标按钮、筛选与分段、搜索框。对话框底部、设置行内和表单里的按钮保持 4px 小圆角。</p>
      <Pair>
        <div className="pair-row">
          <Button variant="accent" pill size="lg" icon={<Play16Filled />}>播放</Button>
          <Button pill icon={<ArrowDownload16Regular />}>下载文件</Button>
          <Button variant="accent" pill iconOnly icon={<Play16Filled />} />
          <Button variant="subtle" iconOnly icon={<ArrowLeft16Regular />} /><Button variant="subtle" iconOnly icon={<ArrowRight16Regular />} />
        </div>
        <div className="pair-row"><Button variant="accent">确定</Button><Button>取消</Button><span className="t-caption c-3">表单与对话框：小圆角</span></div>
      </Pair>

      <h3>分组列表：外大内小</h3>
      <p>设置分组、通知堆叠这类成组的行，每行是一张独立的小卡片，间隙 2px。靠外的角用 <Kv>--radius-group</Kv>（10），行与行之间的角用 <Kv>--radius-group-inner</Kv>（3）——整组读作一个圆润的整体，内部又分得清每一行。只用于分组容器，不用于长列表、侧栏导航和菜单。</p>
      <Pair>
        <div className="group" style={{ width: '100%' }}>
          <SettingRow icon={<Star20Regular />} title="喜爱歌曲" chevron onClick={() => {}} />
          <SettingRow icon={<TextBulletList20Regular />} title="播放列表" chevron onClick={() => {}} />
          <SettingRow icon={<Person20Regular />} title="艺人" chevron onClick={() => {}} />
          <SettingRow icon={<MusicNote220Regular />} title="歌曲" chevron onClick={() => {}} />
        </div>
      </Pair>

      <h3>同心规则</h3>
      <p>嵌套圆角保持同心：内层圆角 = 外层圆角 − 间距。菜单外圆角 8、内边距 4，菜单项圆角为 4；胶囊 Dock 里的图标悬停底为正圆。</p>
    </Section>
  );
}

const SHADOWS: [number, string][] = [[2, '卡片、分段选中块'], [4, '滑块手柄、缩略图'], [8, '桌面小组件、悬浮按钮'], [16, 'Dock、托盘、提示'], [32, '浮层、菜单'], [64, '活动窗口、对话框']];
const LAYERS: [string, number, string][] = [
  ['--z-desktop', 1, '桌面图标'], ['--z-widgets', 2, '桌面小组件'], ['--z-windows', 10, '窗口层（内部按激活顺序递增）'], ['--z-taskbar', 2000, '任务栏'],
  ['--z-flyout', 2100, '开始菜单、控制中心、通知'], ['--z-menu', 3000, '菜单、对话框遮罩'], ['--z-tooltip', 4000, '提示'], ['--z-overlay', 5000, '亮度/夜间模式覆盖层，锁屏 6000'],
];

export function ElevationSection() {
  return (
    <Section id="elevation" title="阴影与层级" lead="每级阴影由一层大范围环境光和一层贴近的接触阴影叠加。暗色模式阴影加深约一倍，并更多依靠发丝线区分层次。">
      <Pair stack={false}>
        <div className="shadow-grid">
          {SHADOWS.map(([n]) => (
            <div key={n}><div className="shadow-box" style={{ boxShadow: `var(--shadow-${n})` }} /><b className="tnum">{n}</b></div>
          ))}
        </div>
      </Pair>
      <div className="spec-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 12 }}>
        <div className="spec-panel" style={{ padding: '8px 12px' }}>
          <table className="spec-table">
            <thead><tr><th>阴影</th><th>用途</th></tr></thead>
            <tbody>{SHADOWS.map(([n, use]) => <tr key={n}><td className="spec-code">--shadow-{n}</td><td className="t-caption c-2">{use}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="spec-panel" style={{ padding: '8px 12px' }}>
          <table className="spec-table">
            <thead><tr><th>层</th><th>z-index</th><th>内容</th></tr></thead>
            <tbody>{LAYERS.map(([t, z, use]) => <tr key={t}><td className="spec-code">{t}</td><td className="tnum">{z}</td><td className="t-caption c-2">{use}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </Section>
  );
}

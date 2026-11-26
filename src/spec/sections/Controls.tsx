import { useState } from 'react';
import { tr } from '@/i18n';
import {
  Avatar, Badge, Breadcrumb, Button, Checkbox, Dialog, Expander, Glass, InfoBar, NavItem, ProgressBar, ProgressRing, Radio, Segmented, SelectButton, SettingRow,
  Slider, Switch, Tabs, TextField, openMenuAt, type MenuItem,
} from '@/ui';
import {
  Add16Regular, ArrowDownload16Regular, BrightnessHigh20Filled, BrightnessHigh20Regular, Checkmark16Regular, ChevronRight16Regular, Copy16Regular, Cut16Regular,
  Delete16Regular, Document20Regular, Edit16Regular, Folder20Filled, Folder20Regular, Grid16Regular, Home20Regular, Image20Regular, Open16Regular, Rename16Regular,
  Search16Regular, Settings16Regular, Share16Regular, Star20Regular, TextBulletList16Regular, Wifi120Regular,
} from '@/ui/icons';
import { Pair, Section } from '../parts';

const L = ({ children }: { children: string }) => <div className="ctl-label">{children}</div>;
const Row = ({ children }: { children: React.ReactNode }) => <div className="pair-row">{children}</div>;

function Buttons() {
  const [pressed, setPressed] = useState(true);
  return (
    <>
      <L>样式</L>
      <Row><Button variant="accent">强调</Button><Button>标准</Button><Button variant="subtle">弱化</Button><Button variant="danger">危险</Button></Row>
      <L>胶囊与圆形：独立主操作、媒体控制、工具栏图标</L>
      <Row><Button variant="accent" pill icon={<ArrowDownload16Regular />}>获取</Button><Button pill>筛选</Button><Button variant="accent" pill iconOnly icon={<Add16Regular />} /><Button pill iconOnly icon={<Settings16Regular />} /></Row>
      <L>带图标 / 仅图标 / 开关按钮</L>
      <Row>
        <Button variant="accent" icon={<ArrowDownload16Regular />}>下载文件</Button><Button icon={<Add16Regular />}>新建</Button>
        <Button iconOnly icon={<Settings16Regular />} tip="设置" /><Button variant="subtle" iconOnly icon={<Share16Regular />} tip="共享" />
        <Button pressed={pressed} icon={<Grid16Regular />} onClick={() => setPressed(!pressed)}>网格</Button>
      </Row>
      <L>尺寸：24 / 32 / 40</L>
      <Row><Button size="sm">小</Button><Button>标准</Button><Button size="lg">大</Button><Button variant="accent" size="lg">主操作</Button></Row>
      <L>禁用</L>
      <Row><Button variant="accent" disabled>强调</Button><Button disabled>标准</Button><Button variant="subtle" disabled>弱化</Button></Row>
    </>
  );
}

function Toggles() {
  const [a, setA] = useState(true), [b, setB] = useState(false);
  const [c, setC] = useState<boolean | 'mixed'>('mixed'), [d, setD] = useState(true), [r, setR] = useState('b');
  return (
    <>
      <L>开关</L>
      <Row><Switch checked={a} onChange={setA} label="开启" /><Switch checked={b} onChange={setB} label="关闭" /><Switch checked disabled label="禁用" /></Row>
      <L>复选框</L>
      <Row><Checkbox checked={d} onChange={setD}>已选中</Checkbox><Checkbox checked={c} onChange={setC}>部分选中</Checkbox><Checkbox checked={false} disabled>禁用</Checkbox></Row>
      <L>单选</L>
      <Row>{[['a', '节能'], ['b', '平衡'], ['c', '高性能']].map(([k, label]) => <Radio key={k} checked={r === k} onChange={() => setR(k)}>{label}</Radio>)}</Row>
    </>
  );
}

function Inputs() {
  const [t, setT] = useState(''), [q, setQ] = useState(() => tr('壁纸')), [p, setP] = useState('libernt'), [sel, setSel] = useState('100%（推荐）');
  const [v, setV] = useState(62), [f, setF] = useState(70);
  return (
    <>
      <L>文本框：静止 / 带内容 / 密码</L>
      <Row>
        <TextField value={t} onChange={setT} placeholder="显示名称" fieldStyle={{ width: 150 }} />
        <TextField value={q} onChange={setQ} clearable prefix={<Search16Regular />} placeholder="搜索" fieldStyle={{ width: 150 }} />
        <TextField value={p} onChange={setP} type="password" fieldStyle={{ width: 120 }} />
      </Row>
      <L>胶囊搜索框 / 下拉选择</L>
      <Row>
        <TextField value={t} onChange={setT} pill prefix={<Search16Regular />} placeholder="搜索应用、设置和文档" fieldStyle={{ width: 240 }} />
        <SelectButton onClick={e => openMenuAt(e.currentTarget, ['100%（推荐）', '125%', '150%'].map(o => ({ label: o, checked: o === sel, onClick: () => setSel(o) })), { minWidth: e.currentTarget.offsetWidth })}>{sel}</SelectButton>
      </Row>
      <L>滑块：标准 / 粗轨道（控制中心）</L>
      <div className="row gap-16" style={{ width: '100%' }}>
        <Slider value={v} onChange={setV} /><span className="tnum c-2" style={{ width: 28 }}>{v}</span>
      </div>
      <div className="cc-card cc-slider" style={{ width: '100%' }}><Slider fat value={f} onChange={setF} icon={<BrightnessHigh20Filled />} /></div>
    </>
  );
}

function Navigation() {
  const [seg, setSeg] = useState('grid'), [tab, setTab] = useState('all'), [nav, setNav] = useState('docs');
  return (
    <>
      <L>分段控件</L>
      <Row>
        <Segmented value={seg} onChange={setSeg} options={[{ value: 'grid', label: '网格', icon: <Grid16Regular /> }, { value: 'list', label: '列表', icon: <TextBulletList16Regular /> }]} />
        <Segmented value={tab} onChange={setTab} options={[{ value: 'all', label: '节能' }, { value: 'b', label: '平衡' }, { value: 'c', label: '高性能' }]} />
      </Row>
      <L>标签页</L>
      <Tabs value={tab} onChange={setTab} options={[{ value: 'all', label: '全部' }, { value: 'b', label: '应用' }, { value: 'c', label: '文档' }, { value: 'd', label: '设置' }]} />
      <L>面包屑</L>
      <Breadcrumb items={['此电脑', '文档', '工作']} />
      <L>导航列表</L>
      <div className="col" style={{ gap: 2, width: 220 }}>
        <NavItem icon={<Home20Regular />} label="主页" active={nav === 'home'} onClick={() => setNav('home')} />
        <NavItem icon={<Folder20Regular />} iconActive={<Folder20Filled />} label="文档" active={nav === 'docs'} onClick={() => setNav('docs')} trailing={<Badge>12</Badge>} />
        <NavItem icon={<Image20Regular />} label="图片" active={nav === 'pics'} onClick={() => setNav('pics')} />
        <NavItem icon={<Star20Regular />} label="收藏" active={nav === 'fav'} onClick={() => setNav('fav')} />
      </div>
    </>
  );
}

function Feedback() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <L>进度</L>
      <div className="row gap-16" style={{ width: '100%' }}><ProgressBar value={64} style={{ flex: 1 }} /><ProgressBar style={{ flex: 1 }} /><ProgressRing /></div>
      <L>徽标与头像</L>
      <Row><Badge>默认</Badge><Badge variant="accent">新</Badge><Badge variant="tint">动态</Badge><Badge variant="success">86%</Badge><Badge variant="caution">待处理</Badge><Badge variant="critical">失败</Badge><Badge variant="accent" dot>3</Badge><Avatar size={28} /><Avatar size={40} /></Row>
      <L>信息栏</L>
      <div className="col gap-8" style={{ width: '100%' }}>
        <InfoBar title="有可用更新" action={<Button size="sm">查看</Button>}>LiberNT 26.12 预览版。</InfoBar>
        <InfoBar severity="success" title="设备受到保护" />
        <InfoBar severity="caution" title="存储空间不足">剩余 12 GB。</InfoBar>
        <InfoBar severity="critical" title="无法连接到网络" />
      </div>
      <L>对话框</L>
      <Button onClick={() => setOpen(true)}>打开对话框</Button>
      <Dialog open={open} title="永久删除" onClose={() => setOpen(false)} actions={[{ label: '删除', variant: 'danger' }, { label: '取消' }]}>确定要永久删除这 3 个项目吗？此操作无法撤销。</Dialog>
    </>
  );
}

const MENU: MenuItem[] = [
  { label: '打开', icon: <Open16Regular />, hint: 'Enter' }, { label: '打开方式', icon: <Edit16Regular />, children: [{ label: '记事本' }, { label: '照片' }] }, { separator: true },
  { label: '剪切', icon: <Cut16Regular />, hint: 'Ctrl+X' }, { label: '复制', icon: <Copy16Regular />, hint: 'Ctrl+C' }, { label: '重命名', icon: <Rename16Regular />, hint: 'F2', disabled: true },
  { separator: true }, { label: '删除', icon: <Delete16Regular />, hint: 'Del', danger: true },
];

function Surfaces() {
  const [on, setOn] = useState(true), [v, setV] = useState(80);
  return (
    <>
      <L>菜单（厚玻璃，圆角 8，菜单项圆角 4）与提示</L>
      <div className="row" style={{ gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <Glass thickness="thick" fixedLuma={0.5} className="menu static-menu" style={{ background: 'var(--surface-card-solid)' }}>
          {MENU.map((it, i) => 'separator' in it ? <div key={i} className="menu-sep" /> : 'label' in it ? (
            <div key={i} className="menu-item" aria-disabled={it.disabled} data-danger={it.danger} data-open={i === 1}>
              <span className="menu-ic">{it.icon}</span><span className="menu-label">{it.label}</span>
              {it.hint && <span className="menu-hint">{it.hint}</span>}{it.children && <ChevronRight16Regular style={{ color: 'var(--text-2)' }} />}
            </div>
          ) : null)}
        </Glass>
        <div className="col gap-12" style={{ alignItems: 'flex-start' }}>
          <Glass thickness="thick" fixedLuma={0.5} className="tooltip static-tip" style={{ background: 'var(--surface-card-solid)' }}>控制中心</Glass>
          <Button onClick={e => openMenuAt(e.currentTarget, MENU)} icon={<Checkmark16Regular />}>弹出真实菜单</Button>
          <span className="t-caption c-3">悬停任意带提示的控件<br />450ms 后出现提示</span>
        </div>
      </div>
      <L>设置行与展开行</L>
      <div className="group" style={{ width: '100%' }}>
        <SettingRow icon={<Wifi120Regular />} title="WLAN" desc="LiberNT-5G"><Switch checked={on} onChange={setOn} /></SettingRow>
        <SettingRow icon={<BrightnessHigh20Regular />} title="亮度"><Slider value={v} onChange={setV} style={{ flex: '0 0 140px' }} /></SettingRow>
        <Expander icon={<Document20Regular />} title="高级选项" desc="点击展开">
          <SettingRow title="子项" desc="展开区域使用更深一级的底色"><Button size="sm">更改</Button></SettingRow>
        </Expander>
        <SettingRow icon={<Folder20Regular />} title="可点击的行" desc="进入下一级页面" chevron onClick={() => {}} />
      </div>
    </>
  );
}

export function ControlSection() {
  return (
    <Section id="controls" title="控件" lead="基础控件沿用 Fluent 的结构与交互模型：控件有「厚度」——亮色下底边加深，暗色下顶边提亮；悬停与按下只改变填充，不改变尺寸。下列控件均可直接操作。">
      <h3>按钮</h3>
      <p>一个视图只放一个强调按钮。弱化按钮用于工具条与次要操作（仅图标时为圆形）；危险按钮只出现在确认对话框中。表单按钮为 4px 小圆角，胶囊留给独立操作。按下时整体缩至 0.98。</p>
      <Pair><Buttons /></Pair>
      <h3>选择</h3>
      <p>开关用于立即生效的设置；复选框用于需要提交的多选；单选用于互斥选项。复选框是圆形的：勾从圆内划出圈外，圈内部分为强调色上的文字色、圈外部分反转为强调色——与圆中带点的单选一眼可分。开关是高胖的 44 × 26 轨道：关闭时是描边轨道加小圆点，打开后圆钮撑满轨道并以弹簧曲线滑到另一端。</p>
      <Pair><Toggles /></Pair>
      <h3>输入</h3>
      <p>文本框聚焦时底边出现 2px 强调色指示线；搜索框一律为胶囊，改用外发光焦点环。粗轨道滑块同为胶囊。标准滑块的手柄是一枚横向胶囊，始终可见：静止时为不透明的浅色（两种主题相同），拖动时变为透出轨道的玻璃。轨道两头各内缩半个手柄宽，手柄不会探出控件。</p>
      <Pair><Inputs /></Pair>
      <h3>导航</h3>
      <p>选中项以左侧 3×16 的强调色短条标示，并切换为 Filled 图标。分段控件为胶囊外形，选中块在选项间滑动；给定宽度时各项按内容平分余量撑满。</p>
      <Pair><Navigation /></Pair>
      <h3>反馈</h3>
      <Pair><Feedback /></Pair>
      <h3>菜单、提示与设置行</h3>
      <Pair><Surfaces /></Pair>
    </Section>
  );
}

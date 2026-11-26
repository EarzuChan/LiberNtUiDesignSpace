import { ACCENTS, accentCss } from '@/lib/accents';
import { useSys } from '@/lib/system';
import { resolveWallpaper } from '@/lib/wallpapers';
import { Glass, Segmented } from '@/ui';
import { Checkmark16Filled, CursorClick24Regular, Eye24Regular, Layer24Regular, Sparkle24Regular } from '@/ui/icons';
import { Kv, Pair, Section, Tokens } from '../parts';

const PRINCIPLES = [
  { icon: <Eye24Regular />, title: '内容优先', body: '外壳退后一步。窗口底板、Dock 和浮层都让位于壁纸与内容，自身只保留必要的形体暗示。' },
  { icon: <Layer24Regular />, title: '材质有据', body: '玻璃的着色明度与不透明度随其背后的亮度自适应；前景色只跟随系统亮/暗模式，保证可读性稳定。' },
  { icon: <Sparkle24Regular />, title: '层次清晰', body: '用模糊、柔和阴影与发丝线表达前后关系，不用粗边框。边缘只做内沿高光，不做折射。' },
  { icon: <CursorClick24Regular />, title: '动效克制', body: '进入急起缓停，退出干脆利落。弹簧曲线只用于可被直接操纵的对象，例如 Dock 图标和开关。' },
];

export function OverviewSection() {
  const theme = useSys(s => s.theme);
  const wallpaper = useSys(s => s.wallpaper);
  useSys(s => s.wallpaperRev);
  return (
    <section id="overview">
      <div className="spec-hero">
        <img src={resolveWallpaper(wallpaper, theme).url} alt="" />
        <Glass thickness="regular" fixedLuma={theme === 'dark' ? 0.3 : 0.62} className="spec-hero-card" noise>
          <h1>Liber Design</h1>
          <p>LiberNT 的视觉语言：以 Fluent Design 的结构与控件体系为骨架，融入更通透、更克制的自适应玻璃材质。本页汇总色库、字体、参数、材质、图标与基础控件。</p>
        </Glass>
      </div>
      <div className="spec-principles">
        {PRINCIPLES.map(p => (
          <div key={p.title} className="spec-panel">{p.icon}<div className="t-body-strong">{p.title}</div><p>{p.body}</p></div>
        ))}
      </div>
    </section>
  );
}

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const NEUTRAL = [0, 50, 100, 150, 200, 300, 400, 500, 600, 700, 800, 850, 900, 950, 1000];
const HUES: [string, string][] = [['red', '绯红'], ['orange', '橘橙'], ['amber', '琥珀'], ['green', '翠绿'], ['teal', '青碧'], ['cyan', '湖蓝'], ['blue', '天青'], ['indigo', '靛蓝'], ['violet', '堇紫'], ['pink', '品红']];

function Ramp({ name, label, steps, darkFrom }: { name: string; label: string; steps: number[]; darkFrom: number }) {
  return (
    <div className="ramp" style={{ ['--n' as string]: steps.length }}>
      <span>{label}</span>
      {steps.map(s => (
        <button key={s} type="button" data-tip={`--${name}-${s}`} style={{ background: `var(--${name}-${s})`, color: s >= darkFrom ? 'rgb(255 255 255 / 0.9)' : 'rgb(0 0 0 / 0.7)' }} onClick={() => navigator.clipboard?.writeText(`var(--${name}-${s})`)}>
          {s}
        </button>
      ))}
    </div>
  );
}

export function ColorSection() {
  const s = useSys();
  const wp = resolveWallpaper(s.wallpaper, s.theme);
  const pick = Math.min(s.accentPick[s.wallpaperFile] ?? 0, Math.max(0, s.wallpaperPalette.length - 1));
  const preset = s.accentMode === 'preset';
  return (
    <Section id="color" title="颜色" lead="全部颜色以 OKLCH 定义：明度感知均匀，色相在明暗变化时不漂移。强调色默认从壁纸提取，实色表面再带一点主色调——借鉴 Material You 的思路，但保持 Fluent 的单强调色体系，不引入第二、第三色板。">
      <h3>壁纸取色</h3>
      <p>壁纸降采样后逐像素转到 OKLCH，按色相分桶（15° 一桶），每桶得分 = 面积占比<sup>0.6</sup> × 平均色度，即「够大且够鲜艳」的色相胜出；取色相相距 ≥ 40° 的至多 4 个候选。过暗、过亮、过灰的像素不参与。动态壁纸的昼/夜两张各取各的；近乎单色的壁纸给出低饱和强调色而不硬造颜色。实现见 <Kv>src/lib/palette.ts</Kv>。</p>
      <div className="spec-panel row" style={{ gap: 24 }}>
        <img src={wp.thumb} alt="" style={{ width: 200, aspectRatio: '16 / 10', objectFit: 'cover', borderRadius: 6, boxShadow: '0 0 0 1px var(--stroke-control)' }} />
        <div className="col gap-12 grow">
          <div className="row gap-12">
            <Segmented value={s.accentMode} onChange={v => s.set({ accentMode: v })} options={[{ value: 'wallpaper', label: '跟随壁纸' }, { value: 'preset', label: '自选颜色' }]} />
            <span className="t-caption c-2">{wp.name} · {s.theme === 'dark' ? '暗色' : '亮色'}</span>
          </div>
          <div className="row gap-12">
            {s.wallpaperPalette.map((a, i) => (
              <button key={i} type="button" className="col" style={{ alignItems: 'center', gap: 6 }} onClick={() => s.set({ accentMode: 'wallpaper', accentPick: { ...s.accentPick, [s.wallpaperFile]: i } })}>
                <span className="swatch" aria-checked={s.accentMode === 'wallpaper' && i === pick} style={{ width: 44, height: 44, background: accentCss(a) }}>{s.accentMode === 'wallpaper' && i === pick && <Checkmark16Filled style={{ color: 'var(--on-accent)' }} />}</span>
                <span className="spec-code">h{a.h} c{a.c}</span>
              </button>
            ))}
          </div>
          <p className="t-caption c-2">护栏：色度限制在 0.085–0.19；黄、青柠一带（h≈40–150）在亮色模式下提高基准明度，其上文字自动改为深色（<Kv>--on-accent</Kv>）。</p>
        </div>
      </div>

      <h3>表面着色</h3>
      <p>强调色的色相同时注入中性表面：窗口实色回退、内容面板、卡片，以及玻璃的着色层。三档强度——关（纯中性）、柔和（默认）、鲜明。暗色模式下卡片采用「色调高度」：越高的层越亮、色调越重，少靠阴影。低饱和的强调色会自动减弱着色。</p>
      <div className="spec-panel">
        <Segmented value={String(s.tintLevel)} onChange={v => s.set({ tintLevel: Number(v) as 0 | 1 | 2 })} options={[{ value: '0', label: '关' }, { value: '1', label: '柔和' }, { value: '2', label: '鲜明' }]} />
        <div className="pair" style={{ marginTop: 16 }}>
          {(['light', 'dark'] as const).map(t => (
            <div key={t} data-theme={t} style={{ background: 'var(--surface-base)' }}>
              <div className="pair-label">{t === 'light' ? '亮色' : '暗色'} · --surface-base</div>
              <div style={{ background: 'var(--surface-pane)', borderRadius: 8, padding: 16, boxShadow: 'inset 0 0 0 1px var(--stroke-card)' }}>
                <div className="t-caption c-2" style={{ marginBottom: 10 }}>--surface-pane</div>
                <div className="group">
                  <div className="srow" style={{ minHeight: 44 }}>--surface-card</div>
                  <div className="srow" style={{ minHeight: 44 }}>卡片在面板之上再高一层</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <h3>强调色</h3>
      <p>强调色由色相 <Kv>--accent-h</Kv>、色度 <Kv>--accent-c</Kv> 与亮色基准明度 <Kv>--accent-l</Kv> 三个参数驱动，悬停、按下、文字、淡底等派生色全部由它们计算。暗色模式下强调色提亮并降低色度，其上的文字改用深色。下面是可自选的预设色。</p>
      <div className="pair-row" style={{ marginBottom: 20 }}>
        {ACCENTS.map(a => (
          <button key={a.id} type="button" className="col" style={{ alignItems: 'center', gap: 6 }} onClick={() => s.set({ accent: a.id, accentMode: 'preset' })}>
            <span className="swatch" aria-checked={preset && a.id === s.accent} style={{ width: 44, height: 44, background: accentCss(a) }}>{preset && a.id === s.accent && <Checkmark16Filled style={{ color: 'var(--on-accent)' }} />}</span>
            <span className="t-caption c-2">{a.name}</span>
          </button>
        ))}
      </div>
      <Pair stack={false}>
        <Tokens names={['--accent', '--accent-hover', '--accent-pressed', '--accent-text', '--accent-subtle', '--accent-ring', '--on-accent', '--surface-pane', '--logo-from', '--logo-to']} />
      </Pair>

      <h3>原子色板</h3>
      <p>中性色带极轻微的冷调（h = 260）。彩色每个色相 11 阶，明度阶梯一致，色度在 500–600 达到峰值。点击色块复制变量名。</p>
      <div className="spec-panel">
        <Ramp name="neutral" label="中性" steps={NEUTRAL} darkFrom={500} />
        <div style={{ height: 12 }} />
        {HUES.map(([n, l]) => <Ramp key={n} name={n} label={l} steps={STEPS} darkFrom={600} />)}
      </div>

      <h3>语义色</h3>
      <p>文本与填充大量使用带透明度的黑/白，使其叠在玻璃或彩色表面上时自然融合。下列数值为各主题下的实际计算结果。</p>
      <Pair stack={false}>
        <h4 style={{ marginTop: 0 }}>文本</h4>
        <Tokens text names={['--text-1', '--text-2', '--text-3', '--text-disabled', '--accent-text']} />
        <h4>控件填充</h4>
        <Tokens names={['--fill-control', '--fill-control-hover', '--fill-control-pressed', '--fill-control-alt', '--fill-control-strong', '--fill-subtle-hover', '--fill-subtle-selected', '--fill-input', '--fill-track', '--fill-tile']} />
        <h4>描边</h4>
        <Tokens names={['--stroke-control', '--stroke-control-edge', '--stroke-input-bottom', '--stroke-divider', '--stroke-card', '--glass-edge']} />
        <h4>表面</h4>
        <Tokens names={['--surface-base', '--surface-pane', '--surface-card', '--surface-card-solid', '--surface-smoke']} />
        <h4>状态</h4>
        <Tokens names={['--success', '--success-bg', '--caution', '--caution-bg', '--critical', '--critical-bg', '--danger-fill']} />
      </Pair>
    </Section>
  );
}

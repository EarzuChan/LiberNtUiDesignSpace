import { useEffect, useRef, useState } from 'react';
import { useSys } from '@/lib/system';
import { WALLPAPERS, resolveWallpaper, wallpaperThumb } from '@/lib/wallpapers';
import { Button, Glass, ProgressiveBlur, type GlassThickness } from '@/ui';
import { Play16Filled } from '@/ui/icons';
import { Kv, Section } from '../parts';

const THICKNESS: [GlassThickness, string, string, string][] = [
  ['ultrathin', '极薄', 'blur 14 · k 0.55', '贴靠预览、图片上的悬浮按钮'],
  ['thin', '薄', 'blur 24 · k 0.78', '桌面小组件'],
  ['regular', '常规', 'blur 40 · k 1.00', 'Dock、托盘、任务栏底板'],
  ['thick', '厚', 'blur 60 · k 1.14', '开始菜单、控制中心、菜单、提示'],
  ['mica', '云母', 'blur 90 · 独立不透明度', '窗口底板（侧栏、标题栏透出）'],
];
const LUMA = [0.08, 0.3, 0.5, 0.7, 0.92];

/** 读取某主题下的玻璃参数并按公式算出着色明度/不透明度 */
function AdaptiveStrip({ theme, url }: { theme: 'light' | 'dark'; url: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [p, setP] = useState({ l0: 0, l1: 0, a0: 0, a1: 0 });
  useEffect(() => {
    const cs = getComputedStyle(ref.current!);
    const n = (k: string) => parseFloat(cs.getPropertyValue(k));
    setP({ l0: n('--glass-l0'), l1: n('--glass-l1'), a0: n('--glass-a0'), a1: n('--glass-a1') });
  }, [theme]);
  return (
    <div className="adaptive-strip" data-theme={theme} ref={ref} style={{ marginBottom: 12 }}>
      <img src={url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgb(0 0 0 / 0.86), rgb(0 0 0 / 0.5) 25%, transparent 50%, rgb(255 255 255 / 0.5) 75%, rgb(255 255 255 / 0.88))' }} />
      {LUMA.map(bl => (
        <div key={bl} style={{ position: 'relative' }}>
          <Glass thickness="regular" fixedLuma={bl} className="mat-card">
            <b>{theme === 'light' ? '亮色' : '暗色'} · bl {bl}</b>
            <span>L {(p.l0 + (p.l1 - p.l0) * bl).toFixed(2)} · A {(p.a0 + (p.a1 - p.a0) * bl).toFixed(2)}</span>
          </Glass>
        </div>
      ))}
    </div>
  );
}

export function MaterialSection() {
  const theme = useSys(s => s.theme);
  const id = useSys(s => s.wallpaper);
  useSys(s => s.wallpaperRev);
  const url = resolveWallpaper(id, theme).url;
  return (
    <Section id="material" title="材质" lead="外壳表面使用自适应玻璃：模糊并提高后方内容的饱和度，再叠一层着色。着色不是固定值——它根据表面背后的平均亮度实时调节，使同一块玻璃在明亮与昏暗的背景上都既通透又可读。">
      <h3>厚度</h3>
      <p>五档厚度共用同一套着色公式，仅模糊半径与不透明度系数 k 不同。越靠近用户、承载文字越多的表面越厚。</p>
      <div className="mat-stage" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <img src={url} alt="" />
        {THICKNESS.map(([t, name, spec, use]) => (
          <Glass key={t} thickness={t} fixedLuma={theme === 'dark' ? 0.35 : 0.6} className="mat-card" noise style={{ minHeight: 150 }}>
            <b>{name}</b>
            <span>.mat-{t}</span>
            <span>{spec}</span>
            <span style={{ fontFamily: 'var(--font-ui)', marginTop: 6 }}>{use}</span>
          </Glass>
        ))}
      </div>

      <h3>自适应着色</h3>
      <p>
        <Kv>--bl</Kv> 是表面背后的平均亮度（0 暗 → 1 亮）。亮色模式下背景越暗，白色着色越实，以托住深色文字；暗色模式相反——背景越亮，深色着色越实；而在很暗的背景上着色反而提亮变薄，让玻璃从背景中「浮」出来。前景色始终只跟随系统亮/暗模式。
      </p>
      <AdaptiveStrip theme="light" url={resolveWallpaper(id, 'light').url} />
      <AdaptiveStrip theme="dark" url={resolveWallpaper(id, 'dark').url} />
      <div className="spec-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="spec-panel">
          <div className="t-body-strong" style={{ marginBottom: 8 }}>着色公式</div>
          <pre className="spec-code" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{`L = l0 + (l1 − l0) × bl          /* 着色明度 */
A = (a0 + (a1 − a0) × bl) × k    /* 不透明度，上限 0.97 */

background: oklch(L c h / A);     /* h、c 取自强调色（表面着色） */
backdrop-filter: blur(r) saturate(s);
transition: --bl 420ms linear;   /* @property 注册为 <number> */`}</pre>
        </div>
        <div className="spec-panel">
          <div className="t-body-strong" style={{ marginBottom: 8 }}>亮度采样</div>
          <p className="t-caption c-2" style={{ lineHeight: '19px' }}>
            壁纸被降采样为 64×36 的亮度网格；窗口作为遮挡物按层级参与合成。每个玻璃表面在自身矩形内取至多 10×10 个采样点求平均：桌面层只看壁纸，窗口层看壁纸与更低的窗口，外壳层看全部。采样会按壁纸的契合度（填充/适应/拉伸/居中/平铺）换算坐标，并计入暗色模式下的压暗量。窗口移动、主题或壁纸变化时重新计算，结果经 420ms 过渡写入 <Kv>--bl</Kv>。实现见 <Kv>src/lib/luma.ts</Kv>。
          </p>
        </div>
      </div>

      <h3>暗色模式下的壁纸压暗</h3>
      <p>暗色模式下，过亮的壁纸会让整个桌面刺眼、也让深色玻璃发灰。系统按壁纸的平均亮度自适应压暗：低于 0.32 不动，越亮压得越多，上限 50%（<Kv>dim = clamp((luma − 0.32) × 0.9, 0, 0.5)</Kv>）。默认叠加中性黑，不改变照片的色相；可切换为「带色调」——叠加主色相的极深色，氛围更统一但会偏色。压暗量同步给亮度采样器，锁屏共用同一层。</p>
      <div className="spec-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[['原图', 'transparent', 0], ['中性压暗 35%', '#000', 0.35], ['带色调压暗 35%', 'oklch(0.16 0.07 var(--accent-h))', 0.35]].map(([label, bg, o]) => (
          <div key={label as string} style={{ position: 'relative', aspectRatio: '16 / 9', borderRadius: 8, overflow: 'hidden' }}>
            <img src={wallpaperThumb('ridges')} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <i style={{ position: 'absolute', inset: 0, background: bg as string, opacity: o as number }} />
            <span className="callout" style={{ left: 10, bottom: 10 }}>{label}</span>
          </div>
        ))}
      </div>

      <h3>渐进式模糊</h3>
      <p>内容滑入标题区时由清晰渐变为模糊，而不是被一条硬边切断。用于窗口内的工具栏、设置页标题，以及屏幕底部任务栏下方。实现为 5 层 <Kv>backdrop-filter</Kv>，模糊半径逐层倍增，每层用渐变蒙版限定在一段带内。</p>
      <div className="spec-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {[true, false].map(progressive => (
          <div key={String(progressive)} className="pblur-demo">
            {progressive
              ? <><ProgressiveBlur side="top" size={84} strength={14} /><div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 84, zIndex: 1, pointerEvents: 'none', background: 'linear-gradient(color-mix(in oklch, var(--surface-pane) 86%, transparent) 50%, transparent)' }} /></>
              : <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 52, zIndex: 1, backdropFilter: 'blur(14px)', background: 'color-mix(in oklch, var(--surface-pane) 70%, transparent)', borderBottom: '1px solid var(--stroke-divider)' }} />}
            <div className="pblur-demo-head">{progressive ? '渐进式模糊（采用）' : '均匀模糊 + 分割线（对照）'}<span className="t-caption c-3" style={{ marginLeft: 8, fontWeight: 400 }}>滚动试试</span></div>
            <div className="scroll">{[...WALLPAPERS, ...WALLPAPERS].slice(0, 24).map((w, i) => <img key={i} src={wallpaperThumb(w.light)} alt="" loading="lazy" />)}</div>
          </div>
        ))}
      </div>

      <h3>边缘</h3>
      <p>玻璃边缘由三部分构成：外沿 1px 深色发丝线把表面从背景中分离，内沿 1px 高光勾勒厚度，顶边高光更亮以暗示来自上方的光源。不模拟折射与色散。大面积模糊表面叠加一层极淡的噪点以消除色带。</p>
      <div className="mat-stage" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <img src={url} alt="" />
        <Glass thickness="regular" edge={false} fixedLuma={0.5} className="mat-card edge-demo"><span>无边缘</span></Glass>
        <Glass thickness="regular" fixedLuma={0.5} className="mat-card edge-demo"><span>.mat-edge　发丝线 + 内沿高光</span></Glass>
        <Glass thickness="regular" fixedLuma={0.5} noise className="mat-card edge-demo" style={{ ['--mat-shadow' as string]: 'var(--shadow-32)' }}><span>+ 噪点 + 阴影 32</span></Glass>
      </div>
      <p className="spec-note" style={{ marginTop: 16 }}>关闭「透明效果」后，所有 <Kv>.mat</Kv> 回退为同色相的不透明表面，布局与层次保持不变。</p>
    </Section>
  );
}

const DURATIONS: [string, number, string][] = [
  ['--dur-instant', 80, '悬停、按下时的颜色变化'], ['--dur-fast', 140, '小控件状态、提示出现'], ['--dur-normal', 220, '菜单、选中指示、开关'],
  ['--dur-gentle', 320, '浮层、窗口、页面切换'], ['--dur-slow', 480, '壁纸、亮度等环境变化'],
];
const EASINGS: [string, string][] = [
  ['--ease-out', '进入：急起缓停'], ['--ease-in', '退出：缓起急收'], ['--ease-in-out', '位移与形变'],
  ['--ease-spring-soft', '弹簧（柔）：浮层'], ['--ease-spring', '弹簧：Dock 图标、色板'], ['--ease-spring-bouncy', '弹簧（弹）：强调反馈'],
];

function Curve({ token }: { token: string }) {
  const [d, setD] = useState('');
  useEffect(() => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    const nums = (v.match(/-?[\d.]+/g) ?? []).map(Number);
    if (v.startsWith('cubic-bezier')) {
      const [x1, y1, x2, y2] = nums;
      setD(`M0,60 C${x1 * 100},${60 - y1 * 50} ${x2 * 100},${60 - y2 * 50} 100,10`);
    } else setD('M' + nums.map((y, i) => `${(i / (nums.length - 1)) * 100},${60 - y * 50}`).join(' L'));
  }, [token]);
  return (
    <svg width="100" height="64" viewBox="-2 0 104 66">
      <path className="motion-axis" d="M0,60 H100 M0,10 H100" strokeDasharray="2 3" />
      <path className="motion-curve" d={d} />
    </svg>
  );
}

export function MotionSection() {
  const [run, setRun] = useState(false);
  return (
    <Section id="motion" title="动效" lead="动效服务于因果关系：告诉用户东西从哪来、到哪去。时长短、曲线明确，绝不拖沓。">
      <div className="row" style={{ justifyContent: 'space-between', marginTop: 36 }}>
        <h3 style={{ margin: 0 }}>时长</h3>
        <Button variant="accent" icon={<Play16Filled />} onClick={() => setRun(!run)}>播放</Button>
      </div>
      <div className="spec-panel" style={{ marginTop: 12, padding: '8px 24px' }}>
        {DURATIONS.map(([token, ms, use]) => (
          <div key={token} className="motion-row">
            <span className="spec-code">{token}</span>
            <span className="t-body-strong tnum">{ms}ms</span>
            <div className="motion-track" data-run={run} style={{ ['--d' as string]: `${ms}ms`, ['--e' as string]: 'var(--ease-out)' }}><i className="motion-dot" /></div>
            <span className="t-caption c-2">{use}</span>
          </div>
        ))}
      </div>
      <h3>缓动曲线</h3>
      <p>贝塞尔曲线用于状态过渡；弹簧曲线由阻尼模型采样生成（<Kv>scripts/gen-tokens.mjs</Kv>），以 CSS <Kv>linear()</Kv> 表达，配合 <Kv>--dur-spring</Kv>（520ms）使用。下方统一以 700ms 演示。</p>
      <div className="spec-panel" style={{ padding: '8px 24px' }}>
        {EASINGS.map(([token, use]) => (
          <div key={token} className="motion-row" style={{ gridTemplateColumns: '170px 104px 1fr 190px' }}>
            <span className="spec-code">{token}</span>
            <Curve token={token} />
            <div className="motion-track" data-run={run} style={{ ['--d' as string]: '700ms', ['--e' as string]: `var(${token})` }}><i className="motion-dot" /></div>
            <span className="t-caption c-2">{use}</span>
          </div>
        ))}
      </div>
      <h3>编排</h3>
      <div className="spec-panel" style={{ padding: '8px 12px' }}>
        <table className="spec-table">
          <thead><tr><th>场景</th><th>变化</th><th>时长与曲线</th></tr></thead>
          <tbody>
            {[
              ['窗口打开 / 关闭', '缩放 0.94 → 1 并淡入 / 缩放至 0.95 并淡出', '280ms ease-out / 160ms ease-in'],
              ['最小化 / 还原', '整窗缩入 Dock 上对应图标，后 60% 行程淡出', '300ms 加速 / 340ms ease-out'],
              ['最大化 / 贴靠', '位置与尺寸同时插值（FLIP）', '300ms ease-out'],
              ['系统浮层', '自下而上位移 32px 并淡入；退出位移 24px', '300ms ease-out / 150ms ease-in'],
              ['菜单', '从触发点缩放 0.94 → 1', '220ms ease-out'],
              ['Dock 图标', '悬停只换底色，图标不动；按下缩至 0.84；启动时弹跳', '520ms spring'],
              ['自适应着色', '--bl 数值过渡，避免拖动窗口时着色跳变', '420ms linear'],
            ].map(r => <tr key={r[0]}><td className="t-body-strong">{r[0]}</td><td className="t-caption c-2">{r[1]}</td><td className="spec-code">{r[2]}</td></tr>)}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

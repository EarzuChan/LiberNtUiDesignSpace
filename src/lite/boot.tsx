import { useEffect, useState } from 'react';
import { Bar, FLOW, Screen, go, mountLite, params, useKeys } from './parts';

/**
 * 启动画面：纯黑底上的标志与一条细进度条。
 * 标志的两个直角从错开的位置扣合（只重绘标志所在的小区域），之后整个启动过程中保持不动。
 * ?mode= 切换同一版式下的文案变体：update 安装更新 / check 检查磁盘 / resume 从休眠恢复 / repair 准备自动修复 / safe 安全模式
 */
const MODES: Record<string, { text?: string; note?: string; progress?: boolean }> = {
  normal: {},
  update: { text: '正在安装更新', note: '请保持设备通电，不要关机', progress: true },
  check: { text: '正在检查磁盘', note: '按任意键跳过', progress: true },
  resume: { text: '正在恢复' },
  repair: { text: '正在准备自动修复' },
  safe: { text: '安全模式' },
};

function Boot() {
  const mode = MODES[params.get('mode') ?? ''] ?? MODES.normal;
  const [phase, setPhase] = useState<'post' | 'logo' | 'run'>('post');
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const a = setTimeout(() => setPhase('logo'), 500);
    const b = setTimeout(() => setPhase('run'), 1400);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);

  // 带进度的变体：按不均匀的步子推进；直接打开时到 100% 后从头再来
  useEffect(() => {
    if (phase !== 'run' || !mode.progress) return;
    const t = setInterval(() => setPct(p => (p >= 100 ? (FLOW ? 100 : 0) : Math.min(100, p + 1 + Math.floor(Math.random() * (FLOW ? 9 : 4))))), FLOW ? 260 : 620);
    return () => clearInterval(t);
  }, [phase, mode.progress]);

  // 流程模式：启动完成后进入锁屏（T2）
  useEffect(() => {
    if (!FLOW || phase !== 'run' || (mode.progress && pct < 100)) return;
    const t = setTimeout(() => go('/loginui.html'), mode.progress ? 900 : 2800);
    return () => clearTimeout(t);
  }, [phase, pct, mode.progress]);

  useKeys(e => {
    if (e.key === 'Escape' || e.key === 'F8') { e.preventDefault(); go('/bootmenu.html'); }
  });

  return (
    <Screen ground="black" className="boot" phase={phase}>
      <div className="boot-stage">
        <svg className="boot-logo" viewBox="0 0 28 28" fill="none" aria-hidden>
          <defs>
            <linearGradient id="boot-logo-fill" x1="0" y1="1.75" x2="28" y2="26.25" gradientUnits="userSpaceOnUse">
              <stop style={{ stopColor: 'var(--logo-from)' }} />
              <stop offset="1" style={{ stopColor: 'var(--logo-to)' }} />
            </linearGradient>
          </defs>
          <path className="boot-logo-a" d="M0 5.83331H5.83333V20.4166H20.4167V26.25H0V5.83331Z" fill="url(#boot-logo-fill)" />
          <path className="boot-logo-b" d="M28 1.75H7.58331V7.58333H22.1666V22.1667H28V1.75Z" fill="url(#boot-logo-fill)" />
        </svg>
        <div className="boot-status">
          <Bar value={mode.progress ? pct : undefined} />
          {mode.text && <div className="boot-text"><span>{mode.text}</span>{mode.progress && <b>{pct}%</b>}</div>}
          {mode.note && <div className="lite-note">{mode.note}</div>}
        </div>
      </div>
    </Screen>
  );
}

mountLite('LiberNT', <Boot />);

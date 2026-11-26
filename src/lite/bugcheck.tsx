import { useEffect, useMemo, useState } from 'react';
import qrcode from 'qrcode-generator';
import { locale } from '@/i18n';
import { useSys } from '@/lib/system';
import { Logo } from '@/ui/Logo';
import { BUILD, Bar, FLOW, Screen, VERSION, go, mountLite } from './parts';

/**
 * 蓝屏（错误检查）：深墨蓝实色底，不用背景图——崩溃后显卡状态不可信，只能假定有一块基础帧缓冲。
 * 左对齐的排版层级：一句人话 → 进度 → 技术卡片（停止代码、模块、参数、二维码）→ 页脚的版本信息。
 */
const STOP = {
  name: 'DRIVER_IRQL_NOT_LESS_OR_EQUAL',
  code: '0x000000D1',
  module: 'lntgfx.sys',
  args: ['0xFFFFD08A41C2E018', '0x0000000000000002', '0x0000000000000000', '0xFFFFF8027A3B14C6'],
};

/** 二维码：内容是停止代码本身（纯文本），扫出来就能直接搜索 */
function Qr({ text }: { text: string }) {
  const { n, d } = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    return { n, d };
  }, [text]);
  return <svg viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges" aria-hidden><path d={d} fill="currentColor" /></svg>;
}

function BugCheck() {
  const [pct, setPct] = useState(0);
  const [when] = useState(() => new Date().toLocaleString(locale(), { dateStyle: 'medium', timeStyle: 'short' }));
  const device = useSys.getState().deviceName;

  // 转储进度按不均匀的步子跳；流程模式下写完后重新启动
  useEffect(() => {
    if (pct >= 100) {
      if (!FLOW) return;
      const t = setTimeout(() => go('/boot.html?flow', 600), 1600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setPct(p => Math.min(100, p + 2 + Math.floor(Math.random() * 10))), 350 + Math.random() * 700);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <Screen ground="stop">
      <main className="stop-main">
        <div className="stop-col">
          <Logo size={32} mono />
          <h1 className="stop-title">你的设备遇到问题，需要重新启动</h1>
          <p className="stop-lead">尚未保存的工作可能已经丢失。收集完错误信息后，设备会自动重新启动。</p>
          <div className="stop-progress">
            <Bar value={pct} />
            <b>{pct}%</b>
            <span className="lite-note">{pct < 100 ? '正在收集错误信息' : '即将重新启动'}</span>
          </div>
          <div className="stop-card">
            <div className="stop-qr"><Qr text={`LiberNT STOP ${STOP.code} ${STOP.name} ${STOP.module} build ${BUILD}`} /></div>
            <dl className="stop-info">
              <dt>停止代码</dt><dd>{STOP.name} ({STOP.code})</dd>
              <dt>出错模块</dt><dd>{STOP.module}</dd>
              <dt>参数</dt><dd>{STOP.args.slice(0, 2).join('  ')}<br />{STOP.args.slice(2).join('  ')}</dd>
              <dd className="stop-hint">扫描二维码，或在另一台设备上搜索停止代码，了解可能的原因。</dd>
            </dl>
          </div>
        </div>
      </main>
      <footer className="stop-foot">{[`LiberNT ${VERSION}`, `内部版本 ${BUILD}`, device, when].join(' · ')}</footer>
    </Screen>
  );
}

mountLite('LiberNT', <BugCheck />);

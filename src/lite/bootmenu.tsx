import { useEffect, useState, type ReactNode } from 'react';
import { Logo } from '@/ui/Logo';
import { ChevronRight20Regular, Desktop20Regular, Options20Regular, Wrench20Regular } from '@/ui/icons';
import { Screen, VERSION, go, mountLite, params, useKeys, type KeyHint } from './parts';

/**
 * 启动菜单：键盘优先。成组的圆角行，选中项是实色强调填充；默认项底边有一条收拢的倒计时线，按任意键停止。
 * F8 进入高级启动选项（数字键直接选择）。?view=advanced 直接打开高级选项。
 */
interface Entry { id: string; name: string; desc: string; icon: ReactNode; to: () => void; chevron?: boolean }

const DEFAULT = `LiberNT ${VERSION}`;
// 倒计时秒数；?timeout=0 关闭（规范页里的预览用）
const TIMEOUT = Math.max(0, Number(params.get('timeout') ?? 10) || 0);
const ADVANCED: [string, string][] = [
  ['安全模式', 'safe'], ['带网络连接的安全模式', 'safe'], ['带命令行的安全模式', 'safe'], ['启用启动日志', ''],
  ['启用低分辨率显示', ''], ['启用内核调试', ''], ['禁用驱动程序强制签名', ''], ['系统失败时不自动重启', ''],
];
const boot = (mode = '') => go(`/boot.html?flow${mode && `&mode=${mode}`}`);

function BootMenu() {
  const [view, setView] = useState<'main' | 'advanced'>(params.get('view') === 'advanced' ? 'advanced' : 'main');
  const [sel, setSel] = useState(0);
  const [left, setLeft] = useState(view === 'main' ? TIMEOUT : 0);

  const os: Entry[] = [
    { id: 'lnt', name: DEFAULT, desc: 'NVMe 0 · 分区 3 · 默认', icon: <Logo size={20} mono />, to: () => boot() },
    { id: 'prev', name: 'LiberNT 26.05', desc: 'NVMe 0 · 分区 5 · 上一个版本', icon: <Logo size={20} mono />, to: () => boot() },
    // 其他系统：移交控制权后本 Demo 无可显示，黑屏片刻后回到菜单
    { id: 'other', name: 'Fedora Linux 43', desc: 'NVMe 1 · 分区 2 · 链式引导', icon: <Desktop20Regular />, to: () => go('/bootmenu.html', 1200) },
  ];
  const tools: Entry[] = [
    { id: 'recovery', name: '恢复环境', desc: '修复启动问题、还原或重置此设备', icon: <Wrench20Regular />, to: () => go('/recovery.html'), chevron: true },
    { id: 'advanced', name: '高级启动选项', desc: '安全模式、启动日志、调试', icon: <Options20Regular />, to: () => open('advanced'), chevron: true },
  ];
  const items = view === 'main' ? [...os, ...tools] : ADVANCED.map(([name, mode]) => ({ id: name, name, to: () => boot(mode) }));

  const open = (v: typeof view) => { setView(v); setSel(v === 'main' ? os.length + 1 : 0); setLeft(0); };
  const pick = (i: number) => { if (i !== sel) { setSel(i); setLeft(0); } };

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => (left === 1 ? os[0].to() : setLeft(left - 1)), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);

  useKeys(e => {
    const n = items.length;
    if (e.key === 'Enter') { e.preventDefault(); return items[sel].to(); }
    setLeft(0);
    if (e.key === 'ArrowDown') setSel((sel + 1) % n);
    else if (e.key === 'ArrowUp') setSel((sel + n - 1) % n);
    else if (e.key === 'Home') setSel(0);
    else if (e.key === 'End') setSel(n - 1);
    else if (e.key === 'F8' && view === 'main') open('advanced');
    else if ((e.key === 'Escape' || e.key === 'Backspace') && view === 'advanced') open('main');
    else if (view === 'advanced' && /^[1-9]$/.test(e.key) && +e.key <= n) items[+e.key - 1].to();
    else return;
    e.preventDefault();
  });

  const row = (it: Entry, i: number) => (
    <button key={it.id} type="button" role="option" className="l-row" aria-selected={sel === i} tabIndex={-1} onPointerMove={() => pick(i)} onClick={it.to}>
      {it.icon}
      <span className="l-text"><b>{it.name}</b><span>{it.desc}</span></span>
      {it.chevron && <ChevronRight20Regular />}
      {i === 0 && left > 0 && <i className="l-count" style={{ animationDuration: `${TIMEOUT}s` }} />}
    </button>
  );
  const keys: KeyHint[] = view === 'main'
    ? [[['↑', '↓'], '选取'], [['Enter'], '确认'], [['F8'], '高级选项']]
    : [[['↑', '↓'], '选取'], [['1–8'], '直接选择'], [['Enter'], '确认'], [['Esc'], '返回']];

  return (
    <Screen backdrop title="LiberNT 启动管理器" keys={keys}>
      <main className="lite-main">
        {view === 'main' ? (
          <div className="lite-col" role="listbox">
            <h1 className="lite-title">选择要启动的系统</h1>
            <div className="l-group">{os.map(row)}</div>
            <div className="l-group">{tools.map((t, i) => row(t, os.length + i))}</div>
            <div className="bm-count">{left > 0 && `${left} 秒后自动启动 ${DEFAULT}`}</div>
          </div>
        ) : (
          <div className="lite-col bm-adv" role="listbox">
            <h1 className="lite-title">高级启动选项</h1>
            <p className="lite-lead">{`选择 ${DEFAULT} 本次启动的方式。这些设置只在本次启动生效。`}</p>
            <div className="l-group">
              {ADVANCED.map(([name], i) => (
                <button key={name} type="button" role="option" className="l-row" aria-selected={sel === i} tabIndex={-1} onPointerMove={() => pick(i)} onClick={items[i].to}>
                  <span className="l-num">{i + 1}</span>
                  <span className="l-text"><b>{name}</b></span>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </Screen>
  );
}

mountLite('LiberNT 启动管理器', <BootMenu />);

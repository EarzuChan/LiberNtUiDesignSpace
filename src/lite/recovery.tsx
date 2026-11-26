import { useEffect, useState, type ReactNode } from 'react';
import {
  ArrowCounterclockwise20Regular, ArrowLeft20Regular, ArrowReset20Regular, ArrowRight20Regular, ChevronRight20Regular, History20Regular,
  Options20Regular, Stethoscope20Regular, WindowConsole20Regular,
} from '@/ui/icons';
import { BUILD, Bar, Screen, VERSION, go, mountLite, useKeys, type KeyHint } from './parts';

/**
 * 恢复环境：首页是「继续启动」加一组修复工具磁贴；工具页是选项列表 → 执行中（进度）→ 结果。
 * 全程可只用键盘：方向键移动选中，Enter 确认，Esc 返回。
 */
interface Tool {
  id: string;
  icon: ReactNode;
  name: string;
  desc: string;
  /** 进入工具后的说明与选项；没有选项的工具直接开始执行 */
  lead?: string;
  choices?: [name: string, desc: string][];
  work?: { title: string; steps: string[]; done: [title: string, body: string] };
  to?: () => void;
}

const TOOLS: Tool[] = [
  {
    id: 'repair', icon: <Stethoscope20Regular />, name: '启动修复', desc: '自动诊断并修复阻止启动的问题',
    work: { title: '正在诊断你的设备', steps: ['正在检查启动配置…', '正在检查系统文件…', '正在尝试修复…'], done: ['启动修复已完成', '已重建启动配置数据。重新启动后，LiberNT 应该可以正常启动。'] },
  },
  {
    id: 'restore', icon: <History20Regular />, name: '系统还原', desc: '回到之前的还原点，不影响个人文件',
    lead: '选择一个还原点。在那之后安装的应用、驱动程序和更新会被移除，个人文件不受影响。',
    choices: [['11 月 20 日 21:14', '安装显卡驱动程序之前'], ['11 月 12 日 09:02', '安装 LiberNT 26.11 之前'], ['11 月 3 日 18:40', '自动创建的还原点']],
    work: { title: '正在还原系统', steps: ['正在还原系统文件…', '正在还原系统设置…', '正在清理…'], done: ['系统还原已完成', '系统已回到所选的还原点。个人文件没有改动。'] },
  },
  {
    id: 'uninstall', icon: <ArrowCounterclockwise20Regular />, name: '卸载更新', desc: '移除最近安装的更新',
    lead: '如果问题是在某次更新之后出现的，可以先把它卸载。',
    choices: [['卸载最新的质量更新', '11 月 18 日安装 · 安全与稳定性修复'], ['卸载最新的功能更新', '11 月 12 日安装 · LiberNT 26.11']],
    work: { title: '正在卸载更新', steps: ['正在准备…', '正在移除更新…', '正在清理…'], done: ['更新已卸载', '重新启动后生效。'] },
  },
  {
    id: 'reset', icon: <ArrowReset20Regular />, name: '重置此设备', desc: '重新安装 LiberNT，可保留个人文件',
    lead: '重置会重新安装 LiberNT，并移除你安装的应用和驱动程序。',
    choices: [['保留我的文件', '移除应用和设置，保留个人文件'], ['删除所有内容', '移除所有个人文件、应用和设置']],
    work: { title: '正在准备重置', steps: ['正在检查所需空间…', '正在准备恢复映像…'], done: ['已准备好重置', '重新启动后开始重置，期间请保持设备通电。'] },
  },
  { id: 'startup', icon: <Options20Regular />, name: '启动设置', desc: '安全模式、启动日志、调试', to: () => go('/bootmenu.html?view=advanced') },
  { id: 'console', icon: <WindowConsole20Regular />, name: '命令行', desc: '用于高级故障排除' },
];

type View = { k: 'home' } | { k: 'tool' | 'work' | 'done'; tool: Tool } | { k: 'console' };
const PROMPT = 'X:\\LiberNT\\System>';
const restart = () => go('/boot.html?flow', 400);

/** 执行中：逐步显示当前步骤，结束后回调 */
function Work({ tool, onDone }: { tool: Tool; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const steps = tool.work!.steps;
  useEffect(() => {
    const t = setTimeout(() => (step + 1 < steps.length ? setStep(step + 1) : onDone()), 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
  return (
    <div className="lite-col re-work">
      <h1 className="lite-title">{tool.work!.title}</h1>
      <Bar />
      <div className="lite-note">{steps[step]}</div>
    </div>
  );
}

/** 命令行：T0 没有文本框控件，直接接收按键 */
function Console({ onExit }: { onExit: () => void }) {
  const [lines, setLines] = useState<string[]>([`LiberNT 恢复环境 [版本 ${VERSION}.${BUILD}]`, '']);
  const [input, setInput] = useState('');
  useKeys(e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') return onExit();
    if (e.key === 'Backspace') setInput(input.slice(0, -1));
    else if (e.key.length === 1) setInput(input + e.key);
    else if (e.key === 'Enter') {
      const cmd = input.trim().toLowerCase();
      if (cmd === 'exit') return onExit();
      const out = cmd === '' ? [] : cmd === 'help' ? ['help    显示可用命令', 'ver     显示版本', 'cls     清屏', 'exit    返回恢复环境'] : cmd === 'ver' ? [`LiberNT ${VERSION} (${BUILD})`] : ['无法识别的命令。输入 help 查看可用命令。'];
      setLines(cmd === 'cls' ? [] : [...lines, PROMPT + input, ...out, ...(out.length ? [''] : [])].slice(-18));
      setInput('');
    } else return;
    e.preventDefault();
  });
  return (
    <div className="lite-col" data-wide>
      <div className="re-console">
        {lines.map((l, i) => <div key={i}>{l}</div>)}
        <div>{PROMPT}<b>{input}</b><i className="re-caret" /></div>
      </div>
    </div>
  );
}

function Recovery() {
  const [view, setView] = useState<View>({ k: 'home' });
  const [sel, setSel] = useState(0);
  const show = (v: View, s = 0) => { setView(v); setSel(s); };
  const home = (from?: Tool) => show({ k: 'home' }, from ? TOOLS.indexOf(from) + 1 : 0);
  const start = (tool: Tool) => (tool.to ? tool.to() : tool.id === 'console' ? show({ k: 'console' }) : show({ k: tool.choices ? 'tool' : 'work', tool }));

  // 当前视图里可选中的项（顺序即键盘顺序），每项对应一个动作
  const actions: (() => void)[] =
    view.k === 'home' ? [() => go('/boot.html?flow'), ...TOOLS.map(t => () => start(t))]
    : view.k === 'tool' ? [...view.tool.choices!.map(() => () => show({ k: 'work', tool: view.tool })), () => home(view.tool)]
    : view.k === 'done' ? [restart, () => home(view.tool)]
    : [];

  useKeys(e => {
    const n = actions.length;
    if (!n) return;
    let next = sel;
    if (e.key === 'Enter') { e.preventDefault(); return actions[sel](); }
    if (e.key === 'Escape' || e.key === 'Backspace') { if (view.k === 'tool' || view.k === 'done') home(view.tool); return; }
    if (view.k === 'home') {
      // 首页：第 0 项通栏，其后是两列磁贴
      if (e.key === 'ArrowDown') next = sel === 0 ? 1 : sel + 2 < n ? sel + 2 : sel;
      else if (e.key === 'ArrowUp') next = sel <= 2 ? 0 : sel - 2;
      else if (e.key === 'ArrowRight') next = sel > 0 && sel % 2 === 1 ? sel + 1 : sel;
      else if (e.key === 'ArrowLeft') next = sel > 0 && sel % 2 === 0 ? sel - 1 : sel;
      else return;
    } else if (e.key === 'ArrowDown') next = Math.min(n - 1, sel + 1);
    else if (e.key === 'ArrowUp') next = Math.max(0, sel - 1);
    else return;
    e.preventDefault();
    setSel(next);
  });

  const row = (i: number, icon: ReactNode, name: string, desc?: string, chevron?: boolean) => (
    <button key={i} type="button" role="option" className="l-row" aria-selected={sel === i} tabIndex={-1} onPointerMove={() => setSel(i)} onClick={() => actions[i]()}>
      {icon}
      <span className="l-text"><b>{name}</b>{desc && <span>{desc}</span>}</span>
      {chevron && <ChevronRight20Regular />}
    </button>
  );
  const nav: KeyHint = [['↑', '↓'], '选取'];
  const keys: KeyHint[] | undefined =
    view.k === 'home' ? [[['↑', '↓', '←', '→'], '选取'], [['Enter'], '确认']]
    : view.k === 'tool' ? [nav, [['Enter'], '确认'], [['Esc'], '返回']]
    : view.k === 'done' ? [nav, [['Enter'], '确认']]
    : view.k === 'console' ? [[['Enter'], '执行'], [['Esc'], '返回']]
    : undefined;

  return (
    <Screen backdrop title="LiberNT 恢复环境" keys={keys}>
      <main className="lite-main">
        {view.k === 'home' && (
          <div className="lite-col" data-wide role="listbox">
            <h1 className="lite-title">恢复</h1>
            <p className="lite-lead">LiberNT 未能正常启动。你可以再试一次，或者用下面的工具修复。</p>
            <div className="l-group">{row(0, <ArrowRight20Regular />, '继续启动', `退出恢复环境并启动 LiberNT ${VERSION}`)}</div>
            <div className="lite-label">修复工具</div>
            <div className="l-tiles">
              {TOOLS.map((t, i) => (
                <button key={t.id} type="button" role="option" className="l-tile" aria-selected={sel === i + 1} tabIndex={-1} onPointerMove={() => setSel(i + 1)} onClick={() => start(t)}>
                  {t.icon}
                  <span className="l-text"><b>{t.name}</b><span>{t.desc}</span></span>
                </button>
              ))}
            </div>
          </div>
        )}
        {view.k === 'tool' && (
          <div className="lite-col" role="listbox">
            <h1 className="lite-title">{view.tool.name}</h1>
            <p className="lite-lead">{view.tool.lead}</p>
            <div className="l-group">{view.tool.choices!.map(([name, desc], i) => row(i, null, name, desc, true))}</div>
            <div className="l-group">{row(view.tool.choices!.length, <ArrowLeft20Regular />, '返回')}</div>
          </div>
        )}
        {view.k === 'work' && <Work tool={view.tool} onDone={() => show({ k: 'done', tool: view.tool })} />}
        {view.k === 'done' && (
          <div className="lite-col" role="listbox">
            <h1 className="lite-title">{view.tool.work!.done[0]}</h1>
            <p className="lite-lead">{view.tool.work!.done[1]}</p>
            <div className="l-group">
              {row(0, <ArrowRight20Regular />, '重新启动')}
              {row(1, <ArrowLeft20Regular />, '返回恢复环境')}
            </div>
          </div>
        )}
        {view.k === 'console' && <Console onExit={() => home(TOOLS[5])} />}
      </main>
    </Screen>
  );
}

mountLite('LiberNT 恢复环境', <Recovery />);

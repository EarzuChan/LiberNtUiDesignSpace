import { useEffect, useRef, useState, type ReactNode } from 'react';
import { isContainer, pathOf, useFs } from '@/lib/fs';
import { openNode } from '@/lib/open';
import { APPS, type AppId } from '@/lib/apps';
import { findAccent } from '@/lib/accents';
import { locale, tr } from '@/i18n';
import { useSys } from '@/lib/system';
import { openMenuAt } from '@/ui';
import { Add16Regular, ChevronDown16Regular, Dismiss12Regular, Settings16Regular } from '@/ui/icons';
import { useWm } from '@/lib/wm';
import { Caption, useWindow } from '@/shell/Window';
import { Logo } from '@/ui/Logo';
import './apps.css';

/** 一个标签页里的会话：各自保存目录、输出与历史 */
function Session({ active, onTitle }: { active: boolean; onTitle: (title: string) => void }) {
  const [cwd, setCwd] = useState('home');
  const [lines, setLines] = useState<ReactNode[]>([<span className="term-dim">LiberNT 终端 · liber-sh 1.4　输入 help 查看可用命令</span>, '']);
  const [input, setInput] = useState('');
  const [hist, setHist] = useState<string[]>([]);
  const [hi, setHi] = useState(-1);
  const body = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const nodes = useFs(s => s.nodes);
  const sys = useSys();

  const where = (id: string) => (id === 'home' ? '~' : pathOf(id, nodes).map(n => tr(n.name)).join('/').replace(['此电脑', '系统 (C:)', '用户', 'Earzu'].map(tr).join('/'), '~'));
  const prompt = (id: string) => <span className="term-prompt"><b>{sys.userName.toLowerCase()}@{sys.deviceName.toLowerCase()}</b> <i>{where(id)}</i> ❯ </span>;
  useEffect(() => { body.current?.scrollTo(0, body.current.scrollHeight); }, [lines]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { onTitle(where(cwd)); }, [cwd]);
  useEffect(() => { if (active) field.current?.focus(); }, [active]);

  const run = (raw: string) => {
    const out: ReactNode[] = [<>{prompt(cwd)}{raw}</>];
    const [cmd, ...args] = raw.trim().split(/\s+/);
    const arg = args.join(' ');
    const kids = Object.values(nodes).filter(n => n.parent === cwd);
    const find = (name: string) => kids.find(n => n.name === name || tr(n.name) === name) ?? kids.find(n => [n.name, tr(n.name)].some(x => x.toLowerCase().startsWith(name.toLowerCase())));
    switch (cmd) {
      case '': break;
      case 'help': out.push('  ls            列出当前目录', '  cd <目录>     切换目录（.. 返回上级，~ 回到主目录）', '  cat <文件>    显示文本文件内容', '  open <名称>   打开文件、文件夹或应用', '  theme <light|dark>  切换主题', '  neofetch      系统信息', '  pwd  date  whoami  echo  clear'); break;
      case 'clear': setLines([]); return;
      case 'pwd': out.push(pathOf(cwd, nodes).slice(1).map(n => tr(n.name).replace(/^.*\((\w:)\)$/, '$1')).join('\\')); break;
      case 'whoami': out.push(`${sys.deviceName.toLowerCase()}\\${sys.userName.toLowerCase()}`); break;
      case 'date': out.push(new Date().toLocaleString(locale())); break;
      case 'echo': out.push(arg); break;
      case 'ls': out.push(kids.length ? <>{kids.map(n => <span key={n.id} className={isContainer(n) ? 'term-accent' : undefined}>{n.name}{isContainer(n) ? '/' : ''}{'   '}</span>)}</> : <span className="term-dim">（空）</span>); break;
      case 'cd': {
        if (!arg || arg === '~') setCwd('home');
        else if (arg === '..') { const p = nodes[cwd]?.parent; if (p) setCwd(p); }
        else { const n = find(arg); if (n && isContainer(n)) setCwd(n.id); else out.push(`cd: 找不到目录：${arg}`); }
        break;
      }
      case 'cat': { const n = find(arg); out.push(n?.content !== undefined ? tr(n.content) : `cat: 无法读取：${arg}`); break; }
      case 'open': {
        const n = find(arg);
        const app = Object.values(APPS).find(a => a.id === arg || a.name === arg || tr(a.name).toLowerCase() === arg.toLowerCase());
        if (n) openNode(n); else if (app) useWm.getState().launch(app.id as AppId); else out.push(`open: 找不到：${arg}`);
        break;
      }
      case 'theme': if (arg === 'light' || arg === 'dark') sys.set({ theme: arg }); else out.push('用法：theme <light|dark>'); break;
      case 'neofetch': {
        const info = [`${sys.userName.toLowerCase()}@${sys.deviceName.toLowerCase()}`, '─────────────────────', 'OS: LiberNT 26.11 (26200.1742) arm64', 'Shell: liber-sh 1.4', `Theme: ${tr(sys.theme === 'dark' ? '暗色' : '亮色')} · ${tr(sys.accentMode === 'wallpaper' ? '跟随壁纸' : findAccent(sys.accent).name)}`, 'Memory: 19.5 GiB / 32 GiB'];
        out.push(<div className="term-fetch"><Logo size={92} /><div>{info.map((l, i) => <div key={i}>{i === 0 ? <b className="term-accent">{l}</b> : l}</div>)}</div></div>);
        break;
      }
      default: out.push(`liber-sh: 未找到命令：${cmd}`);
    }
    setLines(l => [...l, ...out]);
  };

  return (
    <div className="term-session" hidden={!active} onClick={() => !getSelection()?.toString() && field.current?.focus()}>
      <div className="term-body scroll" ref={body}>
        {lines.map((l, i) => <div key={i} className="term-line">{l}</div>)}
        <div className="term-line">
          {prompt(cwd)}
          <input
            ref={field}
            className="term-input"
            value={input}
            autoFocus
            spellCheck={false}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { run(input); if (input.trim()) setHist(h => [...h, input]); setHi(-1); setInput(''); }
              else if (e.key === 'ArrowUp' && hist.length) { const n = hi < 0 ? hist.length - 1 : Math.max(0, hi - 1); setHi(n); setInput(hist[n]); e.preventDefault(); }
              else if (e.key === 'ArrowDown' && hi >= 0) { const n = hi + 1; if (n >= hist.length) { setHi(-1); setInput(''); } else { setHi(n); setInput(hist[n]); } }
            }}
          />
        </div>
      </div>
    </div>
  );
}

/** 终端窗口：标题栏即标签栏 */
export function Terminal() {
  const { id: winId } = useWindow();
  const [tabs, setTabs] = useState([{ id: 1, title: '~' }]);
  const [active, setActive] = useState(1);
  const seq = useRef(1);

  const add = () => {
    const id = ++seq.current;
    setTabs(t => [...t, { id, title: '~' }]);
    setActive(id);
  };
  const close = (id: number) => {
    if (tabs.length === 1) return useWm.getState().close(winId);
    const i = tabs.findIndex(t => t.id === id);
    const next = tabs.filter(t => t.id !== id);
    setTabs(next);
    if (active === id) setActive(next[Math.max(0, i - 1)].id);
  };
  const rename = (id: number, title: string) => setTabs(ts => ts.map(t => (t.id === id && t.title !== title ? { ...t, title } : t)));

  return (
    <div className="term">
      <div className="term-bar" data-drag>
        <div className="term-tabs" role="tablist">
          {tabs.map(t => (
            <div key={t.id} role="tab" className="term-tab" aria-selected={t.id === active} data-nodrag onPointerDown={e => e.button === 0 && setActive(t.id)} onAuxClick={e => e.button === 1 && close(t.id)}>
              <img src="/icons/apps/terminal.svg" width={16} height={16} alt="" />
              <span className="ellipsis">liber-sh · {t.title}</span>
              <button type="button" className="term-tab-x" data-tip="关闭标签页" onPointerDown={e => e.stopPropagation()} onClick={() => close(t.id)}><Dismiss12Regular /></button>
            </div>
          ))}
          <button type="button" className="term-tab-btn" data-tip="新建标签页" data-tip-side="bottom" onClick={add}><Add16Regular /></button>
          <button
            type="button"
            className="term-tab-btn"
            onClick={e => openMenuAt(e.currentTarget, [
              { header: '配置文件' },
              { label: 'liber-sh', hint: 'Ctrl+Shift+1', onClick: add },
              { separator: true },
              { label: '设置', icon: <Settings16Regular />, onClick: () => useWm.getState().launch('settings', { page: 'personalization' }) },
            ])}
          >
            <ChevronDown16Regular />
          </button>
        </div>
        <Caption />
      </div>
      {tabs.map(t => <Session key={t.id} active={t.id === active} onTitle={title => rename(t.id, title)} />)}
    </div>
  );
}

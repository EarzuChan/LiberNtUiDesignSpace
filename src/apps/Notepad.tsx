import { useEffect, useRef, useState } from 'react';
import { locale, tr } from '@/i18n';
import { useFs } from '@/lib/fs';
import { useWm, type Win } from '@/lib/wm';
import { TitleBar } from '@/shell/Window';
import { Button, openMenuAt } from '@/ui';
import './apps.css';

export function Notepad({ win }: { win: Win }) {
  const id = (win.payload as { id?: string } | undefined)?.id;
  const node = useFs(s => (id ? s.nodes[id] : undefined));
  // 示例文档的内容按当前界面语言显示
  const [text, setText] = useState(() => tr(node?.content ?? ''));
  const [saved, setSaved] = useState(text);
  const [wrap, setWrap] = useState(true);
  const [pos, setPos] = useState({ line: 1, col: 1 });
  const ref = useRef<HTMLTextAreaElement>(null);
  const name = node?.name ?? '无标题';
  const dirty = text !== saved;

  useEffect(() => { useWm.getState().setTitle(win.id, `${name} - 记事本`); }, [name, win.id]);

  const save = () => {
    if (id) useFs.getState().write(id, text);
    else useFs.getState().createFile('documents', '无标题.txt', 'text', text);
    setSaved(text);
  };
  const caret = () => {
    const el = ref.current!;
    const before = el.value.slice(0, el.selectionStart).split('\n');
    setPos({ line: before.length, col: before[before.length - 1].length + 1 });
  };

  return (
    <div className="app-solid" onKeyDown={e => { if (e.ctrlKey && e.key === 's') { e.preventDefault(); save(); } }}>
      <TitleBar title={<span className="row gap-8">{name}{dirty && <i className="notepad-dot" />}</span>} />
      <div className="menubar">
        <Button variant="subtle" onClick={e => openMenuAt(e.currentTarget, [
          { label: '新建窗口', hint: 'Ctrl+N', onClick: () => useWm.getState().open('notepad') },
          { label: '保存', hint: 'Ctrl+S', disabled: !dirty, onClick: save },
          { separator: true },
          { label: '关闭', onClick: () => useWm.getState().close(win.id) },
        ])}>文件</Button>
        <Button variant="subtle" onClick={e => openMenuAt(e.currentTarget, [
          { label: '全选', hint: 'Ctrl+A', onClick: () => ref.current?.select() },
          { label: '插入时间和日期', hint: 'F5', onClick: () => setText(t => t + new Date().toLocaleString(locale())) },
          { separator: true },
          { label: '清空', danger: true, onClick: () => setText('') },
        ])}>编辑</Button>
        <Button variant="subtle" onClick={e => openMenuAt(e.currentTarget, [
          { label: '自动换行', checked: wrap, onClick: () => setWrap(!wrap) },
        ])}>查看</Button>
      </div>
      <textarea
        ref={ref}
        className="notepad-edit scroll"
        data-wrap={wrap}
        value={text}
        spellCheck={false}
        onChange={e => setText(e.target.value)}
        onSelect={caret}
        placeholder="在此输入…"
      />
      <div className="statusbar tnum">
        <span>行 {pos.line}，列 {pos.col}</span>
        <span>{text.length} 个字符</span>
        <span className="grow" />
        <span>{node?.type === 'markdown' ? 'Markdown' : '纯文本'}</span>
        <span>UTF-8</span>
      </div>
    </div>
  );
}

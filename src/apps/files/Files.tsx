import { useEffect, useMemo, useRef, useState } from 'react';
import { create } from 'zustand';
import { cmpText, matchText, tr } from '@/i18n';
import { formatSize, formatTime, iconOf, isContainer, pathOf, typeLabel, useFs, type FsNode } from '@/lib/fs';
import { openNode } from '@/lib/open';
import { useWm, type Win } from '@/lib/wm';
import { Caption } from '@/shell/Window';
import { Breadcrumb, Button, Dialog, NavItem, ProgressBar, ProgressiveBlur, TextField, openMenu, openMenuAt, type MenuItem } from '@/ui';
import {
  ArrowClockwise16Regular, ArrowLeft16Regular, ArrowRight16Regular, ArrowSort16Regular, ArrowSortDown16Regular, ArrowSortUp16Regular, ArrowUp16Regular,
  ClipboardPaste16Regular, Copy16Regular, Cut16Regular, Delete16Regular, FolderAdd16Regular, Grid16Regular, Info16Regular, Open16Regular,
  PanelRight16Regular, Rename16Regular, Search16Regular, TextBulletList16Regular, WindowNew16Regular,
} from '@/ui/icons';
import { DetailsPane, HomeView, PcView } from './views';
import './files.css';

export const QUICK = 'quick';
export const PINNED = ['desktop', 'downloads', 'documents', 'pictures', 'music', 'videos', 'projects'];
type SortKey = 'name' | 'modified' | 'type' | 'size';
const SORT_LABEL: Record<SortKey, string> = { name: '名称', modified: '修改日期', type: '类型', size: '大小' };

const useClipboard = create<{ ids: string[]; cut: boolean }>(() => ({ ids: [], cut: false }));

function compare(a: FsNode, b: FsNode, key: SortKey) {
  if (key === 'modified') return a.modified - b.modified;
  if (key === 'size') return (a.size ?? 0) - (b.size ?? 0);
  if (key === 'type') return cmpText(typeLabel(a), typeLabel(b)) || cmpText(a.name, b.name);
  return cmpText(a.name, b.name);
}

export function Files({ win }: { win: Win }) {
  const nodes = useFs(s => s.nodes);
  const fs = useFs.getState();
  const clip = useClipboard();
  const [hist, setHist] = useState(() => ({ stack: [(win.payload as { path?: string } | undefined)?.path ?? QUICK], i: 0 }));
  const path = hist.stack[hist.i];
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({ key: 'name', asc: true });
  const [sel, setSel] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [details, setDetails] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string[] | null>(null);
  const anchor = useRef<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const cur: FsNode | undefined = path === QUICK ? undefined : nodes[path];
  const go = (id: string) => id !== path && setHist(h => ({ stack: [...h.stack.slice(0, h.i + 1), id], i: h.i + 1 }));
  const step = (d: number) => setHist(h => ({ ...h, i: Math.min(h.stack.length - 1, Math.max(0, h.i + d)) }));
  const up = () => cur?.parent && go(cur.parent);

  useEffect(() => { setSel([]); setQuery(''); setRenaming(null); scroller.current?.scrollTo(0, 0); }, [path]);
  useEffect(() => { useWm.getState().setTitle(win.id, cur?.name ?? '主页'); }, [cur?.name, win.id]);

  const list = useMemo(() => {
    if (!cur) return [];
    const q = query.trim().toLowerCase();
    const dir = sort.asc ? 1 : -1;
    return Object.values(nodes)
      .filter(n => n.parent === path && (!q || matchText(n.name, q)))
      .sort((a, b) => +isContainer(b) - +isContainer(a) || dir * compare(a, b, sort.key));
  }, [nodes, path, query, sort, cur]);

  const open = (n: FsNode) => (isContainer(n) ? go(n.id) : openNode(n));
  const pick = (e: React.MouseEvent, n: FsNode) => {
    if (e.shiftKey && anchor.current) {
      const a = list.findIndex(x => x.id === anchor.current), b = list.findIndex(x => x.id === n.id);
      if (a >= 0 && b >= 0) return setSel(list.slice(Math.min(a, b), Math.max(a, b) + 1).map(x => x.id));
    }
    anchor.current = n.id;
    setSel(e.ctrlKey ? (sel.includes(n.id) ? sel.filter(x => x !== n.id) : [...sel, n.id]) : [n.id]);
  };
  const remove = (ids = sel) => {
    if (!ids.length) return;
    if (path === 'trash') setConfirm(ids);
    else { fs.remove(ids); setSel([]); }
  };
  const newFolder = () => {
    if (!cur) return;
    const id = fs.createFolder(path);
    setSel([id]);
    setRenaming(id);
  };
  const paste = () => {
    if (!cur || !clip.ids.length) return;
    if (clip.cut) { fs.move(clip.ids, path); useClipboard.setState({ ids: [], cut: false }); }
    else fs.copy(clip.ids, path);
  };
  const canEdit = !!cur && path !== 'pc' && path !== 'network';

  const onKey = (e: React.KeyboardEvent) => {
    if (renaming) return;
    const idx = sel.length ? list.findIndex(n => n.id === sel[sel.length - 1]) : -1;
    const cols = view === 'grid' ? getComputedStyle(scroller.current!.querySelector('.files-grid') ?? scroller.current!).gridTemplateColumns.split(' ').length : 1;
    const move = (d: number) => { const n = list[Math.min(list.length - 1, Math.max(0, idx + d))]; if (n) { setSel([n.id]); anchor.current = n.id; } e.preventDefault(); };
    if (e.key === 'Enter' && idx >= 0) open(list[idx]);
    else if (e.key === 'Delete') remove();
    else if (e.key === 'F2' && sel.length === 1) setRenaming(sel[0]);
    else if (e.key === 'Backspace') up();
    else if (e.key === 'a' && e.ctrlKey) { setSel(list.map(n => n.id)); e.preventDefault(); }
    else if (e.key === 'ArrowRight') move(1);
    else if (e.key === 'ArrowLeft') move(-1);
    else if (e.key === 'ArrowDown') move(cols);
    else if (e.key === 'ArrowUp') move(-cols);
  };

  const itemMenu = (e: React.MouseEvent, n: FsNode) => {
    e.preventDefault();
    e.stopPropagation();
    const ids = sel.includes(n.id) ? sel : [n.id];
    setSel(ids);
    const items: MenuItem[] = [
      { label: '打开', icon: <Open16Regular />, hint: 'Enter', onClick: () => open(n) },
      ...(isContainer(n) ? [{ label: '在新窗口中打开', icon: <WindowNew16Regular />, onClick: () => useWm.getState().open('files', { path: n.id }) }] : []),
      { separator: true },
      { label: '剪切', icon: <Cut16Regular />, hint: 'Ctrl+X', onClick: () => useClipboard.setState({ ids, cut: true }) },
      { label: '复制', icon: <Copy16Regular />, hint: 'Ctrl+C', onClick: () => useClipboard.setState({ ids, cut: false }) },
      { label: '重命名', icon: <Rename16Regular />, hint: 'F2', disabled: ids.length !== 1, onClick: () => setRenaming(n.id) },
      { separator: true },
      { label: path === 'trash' ? '永久删除' : '删除', icon: <Delete16Regular />, hint: 'Del', danger: true, onClick: () => remove(ids) },
      { separator: true },
      { label: '属性', icon: <Info16Regular />, onClick: () => setDetails(true) },
    ];
    openMenu({ x: e.clientX, y: e.clientY, items });
  };
  const sortItems: MenuItem[] = [
    ...(Object.keys(SORT_LABEL) as SortKey[]).map<MenuItem>(k => ({ label: SORT_LABEL[k], checked: sort.key === k, onClick: () => setSort({ ...sort, key: k }) })),
    { separator: true },
    { label: '升序', checked: sort.asc, onClick: () => setSort({ ...sort, asc: true }) },
    { label: '降序', checked: !sort.asc, onClick: () => setSort({ ...sort, asc: false }) },
  ];
  const viewItems: MenuItem[] = [
    { label: '大图标', icon: <Grid16Regular />, checked: view === 'grid', onClick: () => setView('grid') },
    { label: '详细信息', icon: <TextBulletList16Regular />, checked: view === 'list', onClick: () => setView('list') },
    { separator: true },
    { label: '详细信息窗格', checked: details, onClick: () => setDetails(!details) },
  ];
  const bgMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setSel([]);
    openMenu({ x: e.clientX, y: e.clientY, items: [
      { label: '查看', icon: <Grid16Regular />, children: viewItems },
      { label: '排序方式', icon: <ArrowSort16Regular />, children: sortItems },
      { separator: true },
      { label: '新建文件夹', icon: <FolderAdd16Regular />, onClick: newFolder },
      { label: '粘贴', icon: <ClipboardPaste16Regular />, hint: 'Ctrl+V', disabled: !clip.ids.length, onClick: paste },
      { separator: true },
      { label: '属性', icon: <Info16Regular />, onClick: () => setDetails(true) },
    ] });
  };

  const crumbs = cur ? pathOf(path, nodes) : [];
  const from = Math.max(0, crumbs.findIndex(c => c.id === 'home'));
  const shown = crumbs.slice(from);
  const selNodes = sel.map(id => nodes[id]).filter(Boolean);
  const special = !cur || path === 'pc';
  const side = (id: string, label?: string, icon?: string) => {
    const n = nodes[id];
    return <NavItem key={id} active={path === id} onClick={() => go(id)} icon={<img src={icon ?? iconOf(n)} alt="" />} label={label ?? n.name} />;
  };

  const renameInput = (n: FsNode) => (
    <input
      className="fitem-rename"
      defaultValue={tr(n.name)}
      autoFocus
      onFocus={e => { const v = e.currentTarget.value; e.currentTarget.setSelectionRange(0, v.lastIndexOf('.') > 0 ? v.lastIndexOf('.') : v.length); }}
      onPointerDown={e => e.stopPropagation()}
      onDoubleClick={e => e.stopPropagation()}
      onKeyDown={e => {
        e.stopPropagation();
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') setRenaming(null);
      }}
      onBlur={e => { const v = e.currentTarget.value.trim(); if (v && v !== tr(n.name)) fs.rename(n.id, v); setRenaming(null); }}
    />
  );

  return (
    <div className="app">
      <aside className="app-sidebar">
        <div className="files-side-head" data-drag><img src="/icons/apps/files.svg" width={20} height={20} alt="" />文件</div>
        <nav className="files-nav scroll">
          <NavItem active={path === QUICK} onClick={() => go(QUICK)} icon={<img src="/icons/places/home.svg" alt="" />} label="主页" />
          <div className="files-nav-title">已固定</div>
          {PINNED.map(id => side(id))}
          <div className="files-nav-title">位置</div>
          {['pc', 'c', 'd', 'e', 'network', 'trash'].map(id => side(id))}
        </nav>
        <div className="files-storage">
          <div className="row" style={{ justifyContent: 'space-between' }}><span className="t-caption">系统 (C:)</span><span className="t-caption c-2 tnum">326 GB 可用</span></div>
          <ProgressBar value={36} style={{ marginTop: 8 }} />
        </div>
      </aside>

      <section className="app-pane files-pane" data-view={special ? 'grid' : view} data-details={details}>
        <header className="files-head">
          <ProgressiveBlur side="top" size={special || view === 'grid' ? 116 : 148} strength={12} />
          <div className="files-head-bg" />
          <div className="files-toolbar chrome-bar" data-drag>
            <Button variant="subtle" iconOnly tip="后退" disabled={hist.i === 0} icon={<ArrowLeft16Regular />} onClick={() => step(-1)} />
            <Button variant="subtle" iconOnly tip="前进" disabled={hist.i === hist.stack.length - 1} icon={<ArrowRight16Regular />} onClick={() => step(1)} />
            <Button variant="subtle" iconOnly tip="上移一级" disabled={!cur?.parent} icon={<ArrowUp16Regular />} onClick={up} />
            <Button variant="subtle" iconOnly tip="刷新" icon={<ArrowClockwise16Regular />} onClick={() => setSel([])} />
            <div className="files-addr" data-nodrag>
              <img src={cur ? iconOf(cur) : '/icons/places/home.svg'} alt="" />
              <Breadcrumb items={cur ? shown.map(c => c.name) : ['主页']} onNavigate={i => cur && go(shown[i].id)} />
            </div>
            <TextField pill fieldClassName="files-search" value={query} onChange={setQuery} clearable prefix={<Search16Regular />} placeholder={`在 ${cur?.name ?? '主页'} 中搜索`} />
            <Caption />
          </div>
          <div className="files-cmd">
            <Button variant="subtle" icon={<FolderAdd16Regular />} disabled={!canEdit} onClick={newFolder}>新建文件夹</Button>
            <span className="files-cmd-sep" />
            <Button variant="subtle" iconOnly tip="剪切" disabled={!sel.length || !canEdit} icon={<Cut16Regular />} onClick={() => useClipboard.setState({ ids: sel, cut: true })} />
            <Button variant="subtle" iconOnly tip="复制" disabled={!sel.length || !canEdit} icon={<Copy16Regular />} onClick={() => useClipboard.setState({ ids: sel, cut: false })} />
            <Button variant="subtle" iconOnly tip="粘贴" disabled={!clip.ids.length || !canEdit} icon={<ClipboardPaste16Regular />} onClick={paste} />
            <Button variant="subtle" iconOnly tip="重命名" disabled={sel.length !== 1 || !canEdit} icon={<Rename16Regular />} onClick={() => setRenaming(sel[0])} />
            <Button variant="subtle" iconOnly tip="删除" disabled={!sel.length || !canEdit} icon={<Delete16Regular />} onClick={() => remove()} />
            <span className="files-cmd-sep" />
            <Button variant="subtle" icon={<ArrowSort16Regular />} disabled={special} onClick={e => openMenuAt(e.currentTarget, sortItems)}>排序</Button>
            <Button variant="subtle" icon={view === 'grid' ? <Grid16Regular /> : <TextBulletList16Regular />} disabled={special} onClick={e => openMenuAt(e.currentTarget, viewItems)}>查看</Button>
            <span className="grow" />
            <Button variant="subtle" iconOnly tip="详细信息窗格" pressed={details} icon={<PanelRight16Regular />} onClick={() => setDetails(!details)} />
          </div>
          {!special && view === 'list' && (
            <div className="files-cols">
              {(Object.keys(SORT_LABEL) as SortKey[]).map(k => (
                <button key={k} type="button" onClick={() => setSort({ key: k, asc: sort.key === k ? !sort.asc : true })}>
                  {SORT_LABEL[k]}{sort.key === k && (sort.asc ? <ArrowSortUp16Regular /> : <ArrowSortDown16Regular />)}
                </button>
              ))}
            </div>
          )}
        </header>

        <div className="files-body">
          <div className="files-scroll scroll" ref={scroller} tabIndex={0} onKeyDown={onKey} onClick={e => e.target === e.currentTarget && setSel([])} onContextMenu={bgMenu}>
            {!cur ? <HomeView go={go} sel={sel} setSel={setSel} /> : path === 'pc' ? <PcView go={go} sel={sel} setSel={setSel} /> : list.length === 0 ? (
              <div className="files-empty"><div><img src={path === 'trash' ? '/icons/places/trash.svg' : '/icons/places/folder-open.svg'} alt="" />{query ? `没有与“${query}”匹配的项目` : path === 'trash' ? '回收站是空的' : '此文件夹为空'}</div></div>
            ) : view === 'grid' ? (
              <div className="files-grid" onClick={e => e.target === e.currentTarget && setSel([])}>
                {list.map(n => (
                  <button key={n.id} type="button" className="fitem fitem-grid" data-node={n.id} aria-selected={sel.includes(n.id)} tabIndex={-1} style={clip.cut && clip.ids.includes(n.id) ? { opacity: 0.5 } : undefined} onClick={e => pick(e, n)} onDoubleClick={() => open(n)} onContextMenu={e => itemMenu(e, n)}>
                    <img src={n.thumb ?? iconOf(n)} data-thumb={n.thumb ? '' : undefined} alt="" />
                    {renaming === n.id ? renameInput(n) : <span>{n.name}</span>}
                  </button>
                ))}
              </div>
            ) : (
              list.map(n => (
                <button key={n.id} type="button" className="fitem fitem-row" data-node={n.id} aria-selected={sel.includes(n.id)} tabIndex={-1} style={clip.cut && clip.ids.includes(n.id) ? { opacity: 0.5 } : undefined} onClick={e => pick(e, n)} onDoubleClick={() => open(n)} onContextMenu={e => itemMenu(e, n)}>
                  <span className="fitem-name"><img src={n.thumb ?? iconOf(n)} alt="" />{renaming === n.id ? renameInput(n) : <span className="ellipsis">{n.name}</span>}</span>
                  <span className="tnum">{formatTime(n.modified)}</span>
                  <span>{typeLabel(n)}</span>
                  <span className="tnum">{formatSize(n.size)}</span>
                </button>
              ))
            )}
          </div>
          {details && <DetailsPane nodes={selNodes} current={cur} count={list.length} />}
        </div>

        <footer className="files-status">
          <span>{cur ? `${list.length} 个项目` : `${PINNED.length} 个固定文件夹`}</span>
          {selNodes.length > 0 && <span>{`已选择 ${selNodes.length} 个项目`}{selNodes.every(n => n.size !== undefined) ? `　${formatSize(selNodes.reduce((a, n) => a + (n.size ?? 0), 0))}` : ''}</span>}
          <span className="grow" />
          {!special && (
            <>
              <Button variant="subtle" size="sm" iconOnly tip="详细信息" pressed={view === 'list'} icon={<TextBulletList16Regular />} onClick={() => setView('list')} />
              <Button variant="subtle" size="sm" iconOnly tip="大图标" pressed={view === 'grid'} icon={<Grid16Regular />} onClick={() => setView('grid')} />
            </>
          )}
        </footer>
      </section>

      <Dialog open={!!confirm} title="永久删除" onClose={() => setConfirm(null)} actions={[{ label: '删除', variant: 'danger', onClick: () => { fs.remove(confirm!); setSel([]); } }, { label: '取消' }]}>
        确定要永久删除这 {confirm?.length} 个项目吗？此操作无法撤销。
      </Dialog>
    </div>
  );
}

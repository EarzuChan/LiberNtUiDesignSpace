import { formatSize, formatTime, iconOf, pathOf, typeLabel, useFs, type FsNode } from '@/lib/fs';
import { openNode } from '@/lib/open';
import { ProgressBar } from '@/ui';
import { PINNED } from './Files';

interface ViewProps { go: (id: string) => void; sel: string[]; setSel: (ids: string[]) => void }

const RECENT = ['projects/libernt-shell/README.md', 'desktop/LiberNT 设计规范.md', 'documents/2026 年度总结.docx', 'downloads/LiberNT-26.11-x64.iso', 'documents/产品发布会.pptx', 'documents/会议纪要.txt', 'pictures/优胜美地.webp', 'documents/预算表 Q4.xlsx'];

function FolderCards({ ids, go, sel, setSel, sub }: ViewProps & { ids: string[]; sub: (n: FsNode) => string }) {
  const nodes = useFs(s => s.nodes);
  return (
    <div className="files-cards">
      {ids.map(id => nodes[id]).filter(Boolean).map(n => (
        <button key={n.id} type="button" className="fcard" aria-selected={sel.includes(n.id)} onClick={() => setSel([n.id])} onDoubleClick={() => go(n.id)}>
          <img src={iconOf(n)} alt="" />
          <div><div className="ellipsis">{n.name}</div><div className="t-caption c-2 ellipsis">{sub(n)}</div></div>
        </button>
      ))}
    </div>
  );
}

/** 主页：快速访问 + 最近使用 */
export function HomeView(p: ViewProps) {
  const nodes = useFs(s => s.nodes);
  const recent = RECENT.map(id => nodes[id]).filter(n => n && n.parent !== 'trash').sort((a, b) => b.modified - a.modified);
  return (
    <>
      <div className="files-section">快速访问</div>
      <FolderCards {...p} ids={PINNED} sub={n => `${Object.values(nodes).filter(c => c.parent === n.id).length} 个项目`} />
      <div className="files-section">最近使用</div>
      {recent.map(n => (
        <button key={n.id} type="button" className="fitem fitem-row" style={{ gridTemplateColumns: 'minmax(180px, 1fr) 160px minmax(120px, 0.6fr)' }} aria-selected={p.sel.includes(n.id)} onClick={() => p.setSel([n.id])} onDoubleClick={() => openNode(n)}>
          <span className="fitem-name"><img src={n.thumb ?? iconOf(n)} alt="" /><span className="ellipsis">{n.name}</span></span>
          <span className="tnum">{formatTime(n.modified)}</span>
          <span>{pathOf(n.id, nodes).slice(-3, -1).map(x => x.name).join(' › ')}</span>
        </button>
      ))}
    </>
  );
}

/** 此电脑：驱动器容量 + 个人文件夹 */
export function PcView(p: ViewProps) {
  const nodes = useFs(s => s.nodes);
  return (
    <>
      <div className="files-section">设备和驱动器</div>
      <div className="files-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {['c', 'd', 'e'].map(id => nodes[id]).map(n => {
          const c = n.capacity!;
          return (
            <button key={n.id} type="button" className="fcard" aria-selected={p.sel.includes(n.id)} onClick={() => p.setSel([n.id])} onDoubleClick={() => p.go(n.id)}>
              <img src={iconOf(n)} alt="" />
              <div>
                <div className="ellipsis">{n.name}</div>
                <ProgressBar value={(c.used / c.total) * 100} />
                <div className="t-caption c-2 tnum">{c.total - c.used} GB 可用，共 {c.total >= 1000 ? `${c.total / 1000} TB` : `${c.total} GB`}</div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="files-section">文件夹</div>
      <FolderCards {...p} ids={PINNED} sub={() => 'Earzu'} />
    </>
  );
}

/** 详细信息窗格 */
export function DetailsPane({ nodes: sel, current, count }: { nodes: FsNode[]; current?: FsNode; count: number }) {
  const all = useFs(s => s.nodes);
  if (sel.length > 1) {
    return (
      <aside className="files-details">
        <img src="/icons/places/folder-open.svg" alt="" />
        <div className="t-body-strong">已选择 {sel.length} 个项目</div>
        <dl><dt>总大小</dt><dd>{formatSize(sel.reduce((a, n) => a + (n.size ?? 0), 0)) || '—'}</dd></dl>
      </aside>
    );
  }
  const n = sel[0] ?? current;
  if (!n) {
    return (
      <aside className="files-details">
        <img src="/icons/places/home.svg" alt="" />
        <div className="t-body-strong">主页</div>
        <div className="t-caption c-2" style={{ marginTop: 4 }}>选择一个项目以查看详细信息</div>
      </aside>
    );
  }
  const kids = Object.values(all).filter(c => c.parent === n.id).length;
  return (
    <aside className="files-details">
      <img src={n.thumb ?? iconOf(n)} data-thumb={n.thumb ? '' : undefined} alt="" />
      <div className="t-body-strong" style={{ wordBreak: 'break-all' }}>{n.name}</div>
      <div className="t-caption c-2" style={{ marginTop: 2 }}>{typeLabel(n)}</div>
      <dl>
        {n.size !== undefined && <><dt>大小</dt><dd>{formatSize(n.size)}</dd></>}
        {n.size === undefined && <><dt>包含</dt><dd>{sel[0] ? kids : count} 个项目</dd></>}
        {n.capacity && <><dt>容量</dt><dd>{n.capacity.used} GB / {n.capacity.total} GB</dd></>}
        <dt>修改时间</dt><dd>{formatTime(n.modified)}</dd>
        <dt>位置</dt><dd>{pathOf(n.id, all).slice(0, -1).map(x => x.name).join(' › ') || '—'}</dd>
      </dl>
    </aside>
  );
}

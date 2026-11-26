import { useEffect, useMemo, useState } from 'react';
import { APPS, START_PINNED, type AppDef } from '@/lib/apps';
import { formatTime, iconOf, pathOf, useFs, type FsNode } from '@/lib/fs';
import { openNode } from '@/lib/open';
import { cmpText, matchText } from '@/i18n';
import { useSession } from '@/lib/session';
import { useSys } from '@/lib/system';
import { useWm } from '@/lib/wm';
import { Avatar, Button, Glass, TextField, openMenuAt, useScrollEdge } from '@/ui';
import { ArrowClockwise16Regular, ArrowExit16Regular, ArrowSync16Regular, ChevronLeft16Regular, ChevronRight16Regular, LockClosed16Regular, Power20Regular, Search20Regular, WeatherMoon16Regular } from '@/ui/icons';
import { SETTINGS_PAGES } from '@/apps/settings/pages';
import { useFlyout } from './hooks';

const RECENT = ['documents/2026 年度总结.docx', 'desktop/LiberNT 设计规范.md', 'documents/产品发布会.pptx', 'downloads/LiberNT-26.11-x64.iso', 'documents/会议纪要.txt', 'pictures/优胜美地.webp'];

export function StartMenu() {
  const { show, state } = useFlyout('start');
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'home' | 'all'>('home');
  const nodes = useFs(s => s.nodes);
  const user = useSys(s => s.userName);
  useEffect(() => {
    if (!show) { setQuery(''); setView('home'); }
  }, [show]);

  const close = () => useSys.getState().setFlyout(null);
  const launch = (a: AppDef) => { close(); useWm.getState().launch(a.id); };
  const openFile = (n: FsNode) => { close(); openNode(n); };
  const session = useSession.getState();

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return null;
    return {
      apps: Object.values(APPS).filter(a => matchText(a.name, q) || a.id.includes(q)).slice(0, 5),
      pages: SETTINGS_PAGES.filter(p => matchText(p.name, q) || p.keywords.some(k => matchText(k, q))).slice(0, 4),
      files: Object.values(nodes).filter(n => matchText(n.name, q) && n.parent).slice(0, 5),
    };
  }, [q, nodes]);

  const [listRef, listEdge] = useScrollEdge({ full: true });
  if (!show) return null;
  const allApps = Object.values(APPS).sort((a, b) => cmpText(a.category, b.category) || cmpText(a.name, b.name));

  return (
    <Glass thickness="thick" className="flyout start" data-state={state} noise>
      <div className="start-search">
        <TextField value={query} onChange={setQuery} pill large clearable prefix={<Search20Regular />} placeholder="搜索应用、设置和文档" autoFocus />
      </div>

      {results ? (
        <div className="start-body" key="results">
          {results.apps.length + results.pages.length + results.files.length === 0 && <div className="start-empty">没有找到与“{query}”相关的结果</div>}
          <div className="start-list scroll" ref={listRef}>
            {results.apps.length > 0 && <div className="start-letter">应用</div>}
            {results.apps.map(a => (
              <button key={a.id} type="button" className="start-row" onClick={() => launch(a)}>
                <img src={a.icon} alt="" /><div><div>{a.name}</div></div><span className="t-caption c-3">应用</span>
              </button>
            ))}
            {results.pages.length > 0 && <div className="start-letter">设置</div>}
            {results.pages.map(p => (
              <button key={p.id} type="button" className="start-row" onClick={() => { close(); useWm.getState().launch('settings', { page: p.id }); }}>
                <img src={APPS.settings.icon} alt="" /><div><div>{p.name}</div></div><span className="t-caption c-3">系统设置</span>
              </button>
            ))}
            {results.files.length > 0 && <div className="start-letter">文档</div>}
            {results.files.map(n => (
              <button key={n.id} type="button" className="start-row" onClick={() => openFile(n)}>
                <img src={iconOf(n)} alt="" /><div><div className="ellipsis">{n.name}</div></div>
                <span className="t-caption c-3 ellipsis" style={{ maxWidth: 220 }}>{pathOf(n.id, nodes).slice(0, -1).map(x => x.name).join(' › ')}</span>
              </button>
            ))}
          </div>
          {listEdge}
        </div>
      ) : view === 'home' ? (
        <div className="start-body" key="home" style={{ ['--from' as string]: '-16px' }}>
          <div className="start-head">
            <span className="t-body-strong">已固定</span>
            <Button size="sm" pill onClick={() => setView('all')}>所有应用<ChevronRight16Regular /></Button>
          </div>
          <div className="start-grid">
            {START_PINNED.map(id => APPS[id]).map(a => (
              <button key={a.id} type="button" className="start-app" onClick={() => launch(a)}><img src={a.icon} alt="" /><span>{a.name}</span></button>
            ))}
          </div>
          <div className="start-head">
            <span className="t-body-strong">推荐</span>
            <Button size="sm" pill onClick={() => { close(); useWm.getState().open('files', { path: 'home' }); }}>更多<ChevronRight16Regular /></Button>
          </div>
          <div className="start-rec">
            {RECENT.map(id => nodes[id]).filter(Boolean).map(n => (
              <button key={n.id} type="button" className="start-row" onClick={() => openFile(n)}>
                <img src={n.thumb ?? iconOf(n)} alt="" style={n.thumb ? { borderRadius: 6, objectFit: 'cover' } : undefined} />
                <div><div className="ellipsis">{n.name}</div><div>{formatTime(n.modified)}</div></div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="start-body" key="all">
          <div className="start-head">
            <span className="t-body-strong">所有应用</span>
            <Button size="sm" pill onClick={() => setView('home')}><ChevronLeft16Regular />返回</Button>
          </div>
          <div className="start-list scroll" ref={listRef}>
            {allApps.map((a, i) => (
              <div key={a.id}>
                {(i === 0 || allApps[i - 1].category !== a.category) && <div className="start-letter">{a.category}</div>}
                <button type="button" className="start-row" onClick={() => launch(a)}><img src={a.icon} alt="" /><div><div>{a.name}</div></div></button>
              </div>
            ))}
          </div>
          {listEdge}
        </div>
      )}

      <div className="start-foot">
        <button type="button" className="start-user" onClick={() => { close(); useWm.getState().launch('settings', { page: 'accounts' }); }}>
          <Avatar size={32} /><span>{user}</span>
        </button>
        <Button
          variant="subtle"
          iconOnly
          tip="电源"
          icon={<Power20Regular />}
          onClick={e => openMenuAt(e.currentTarget, [
            { label: '锁定', icon: <LockClosed16Regular />, onClick: () => session.go('lock') },
            { label: '睡眠', icon: <WeatherMoon16Regular />, onClick: () => session.go('sleep') },
            { label: '注销', icon: <ArrowExit16Regular />, onClick: () => session.end('signout') },
            { separator: true },
            { label: '更新并重启', icon: <ArrowSync16Regular />, onClick: () => session.end('update') },
            { label: '重启', icon: <ArrowClockwise16Regular />, onClick: () => session.end('restart') },
            { label: '关机', icon: <Power20Regular style={{ width: 16, height: 16 }} />, onClick: () => session.end('shutdown') },
          ], { placement: 'above' })}
        />
      </div>
    </Glass>
  );
}

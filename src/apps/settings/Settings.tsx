import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { matchText } from '@/i18n';
import { useSys } from '@/lib/system';
import type { Win } from '@/lib/wm';
import { Caption } from '@/shell/Window';
import { Avatar, Breadcrumb, NavItem, ProgressiveBlur, TextField, useScrollEdge } from '@/ui';
import {
  Accessibility20Filled, Accessibility20Regular, Apps20Filled, Apps20Regular, ArrowSync20Filled, ArrowSync20Regular, Bluetooth20Filled, Bluetooth20Regular,
  Desktop20Filled, Desktop20Regular, GlobeClock20Filled, GlobeClock20Regular, Info20Filled, Info20Regular, PaintBrush20Filled, PaintBrush20Regular,
  Person20Filled, Person20Regular, Search16Regular, Shield20Filled, Shield20Regular, Wifi120Filled, Wifi120Regular,
} from '@/ui/icons';
import { SETTINGS_PAGES, type SettingsPageId } from './pages';
import { SystemPage } from './SystemPage';
import { PersonalizationPage } from './PersonalizationPage';
import { AccountsPage, AppsPage, BluetoothPage, NetworkPage } from './pagesA';
import { AboutPage, AccessibilityPage, PrivacyPage, TimePage, UpdatePage } from './pagesB';
import { resolvePath, type SubProps } from './subpages';
import './settings.css';

export interface PageProps {
  /** 切到另一个一级页 */
  go: (p: SettingsPageId) => void;
  /** 进入当前页的次级页 */
  open: (seg: string) => void;
}

const ICONS: Record<SettingsPageId, [ReactNode, ReactNode]> = {
  system: [<Desktop20Regular />, <Desktop20Filled />],
  bluetooth: [<Bluetooth20Regular />, <Bluetooth20Filled />],
  network: [<Wifi120Regular />, <Wifi120Filled />],
  personalization: [<PaintBrush20Regular />, <PaintBrush20Filled />],
  apps: [<Apps20Regular />, <Apps20Filled />],
  accounts: [<Person20Regular />, <Person20Filled />],
  time: [<GlobeClock20Regular />, <GlobeClock20Filled />],
  accessibility: [<Accessibility20Regular />, <Accessibility20Filled />],
  privacy: [<Shield20Regular />, <Shield20Filled />],
  update: [<ArrowSync20Regular />, <ArrowSync20Filled />],
  about: [<Info20Regular />, <Info20Filled />],
};

const PAGES: Record<SettingsPageId, ComponentType<PageProps>> = {
  system: SystemPage, bluetooth: BluetoothPage, network: NetworkPage, personalization: PersonalizationPage, apps: AppsPage, accounts: AccountsPage,
  time: TimePage, accessibility: AccessibilityPage, privacy: PrivacyPage, update: UpdatePage, about: AboutPage,
};

export function Settings({ win }: { win: Win }) {
  const req = win.payload as { page?: SettingsPageId; sub?: string[] } | undefined;
  // 路径：一级页 id + 各级次级页的段；dir 决定内容的进场方向（进入次级页从右、返回从左、切换一级页上浮）
  const [nav, setNav] = useState<{ path: string[]; dir: 'in' | 'out' | 'switch' }>({ path: [req?.page ?? 'system', ...(req?.sub ?? [])], dir: 'switch' });
  const [query, setQuery] = useState('');
  const user = useSys(s => s.userName);
  const [navRef, navEdge] = useScrollEdge();
  const navigate = (path: string[]) => setNav(cur => {
    const a = cur.path.join('/'), b = path.join('/');
    return a === b ? cur : { path, dir: b.startsWith(a + '/') ? 'in' : a.startsWith(b + '/') ? 'out' : 'switch' };
  });
  useEffect(() => { if (req?.page) navigate([req.page, ...(req.sub ?? [])]); }, [win.payload]);

  const q = query.trim().toLowerCase();
  const pages = SETTINGS_PAGES.filter(p => !q || matchText(p.name, q) || matchText(p.desc, q) || p.keywords.some(k => matchText(k, q)));
  const page = nav.path[0] as SettingsPageId;
  const meta = SETTINGS_PAGES.find(p => p.id === page)!;
  const chain = resolvePath(nav.path);
  const depth = chain.length;
  const path = nav.path.slice(0, depth + 1);
  const Page = (depth ? chain[depth - 1].Page : PAGES[page]) as ComponentType<SubProps>;
  const back = () => { if (depth) navigate(path.slice(0, depth)); };

  return (
    <div
      className="app"
      onKeyDown={e => { if (e.altKey && e.key === 'ArrowLeft') back(); }}
      onMouseUp={e => { if (e.button === 3) back(); }}
    >
      <aside className="app-sidebar">
        <div className="set-side-head" data-drag><img src="/icons/apps/settings.svg" width={20} height={20} alt="" />设置</div>
        <button type="button" className="set-user" onClick={() => navigate(['accounts'])}>
          <Avatar size={44} />
          <div><div className="t-body-strong">{user}</div><div className="t-caption c-2">本地账户 · 管理员</div></div>
        </button>
        <TextField pill fieldClassName="set-search" value={query} onChange={setQuery} clearable prefix={<Search16Regular />} placeholder="查找设置" />
        <nav className="set-nav scroll" ref={navRef}>
          {pages.map(p => (
            <NavItem key={p.id} active={p.id === page} icon={ICONS[p.id][0]} iconActive={ICONS[p.id][1]} label={p.name} onClick={() => navigate([p.id])} />
          ))}
          {pages.length === 0 && <div className="t-caption c-3" style={{ padding: 12 }}>没有匹配的设置</div>}
        </nav>
        {navEdge}
      </aside>
      <section className="app-pane">
        <header className="set-head">
          <ProgressiveBlur side="top" size={116} strength={12} />
          <div className="set-head-bg" />
          <div className="set-head-row" data-drag>
            <div className="set-title">
              <div>
                {depth
                  ? <Breadcrumb size="title" items={[meta.name, ...chain.map(c => c.name)]} onNavigate={i => navigate(path.slice(0, i + 1))} />
                  : <h1 className="t-title">{meta.name}</h1>}
              </div>
            </div>
            <div className="set-head-bar chrome-bar"><Caption /></div>
          </div>
        </header>
        <div className="set-scroll scroll" key={path.join('/')}>
          <div className="set-content" data-dir={nav.dir}><Page go={p => navigate([p])} open={seg => navigate([...path, seg])} seg={path[depth]} /></div>
        </div>
      </section>
    </div>
  );
}

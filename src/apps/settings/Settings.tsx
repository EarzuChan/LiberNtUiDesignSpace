import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { matchText } from '@/i18n';
import { useSys } from '@/lib/system';
import type { Win } from '@/lib/wm';
import { Caption } from '@/shell/Window';
import { Avatar, NavItem, ProgressiveBlur, TextField } from '@/ui';
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
import './settings.css';

export interface PageProps { go: (p: SettingsPageId) => void }

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
  const requested = (win.payload as { page?: SettingsPageId } | undefined)?.page;
  const [page, setPage] = useState<SettingsPageId>(requested ?? 'system');
  const [query, setQuery] = useState('');
  const user = useSys(s => s.userName);
  useEffect(() => { if (requested) setPage(requested); }, [requested, win.payload]);

  const q = query.trim().toLowerCase();
  const pages = SETTINGS_PAGES.filter(p => !q || matchText(p.name, q) || matchText(p.desc, q) || p.keywords.some(k => matchText(k, q)));
  const meta = SETTINGS_PAGES.find(p => p.id === page)!;
  const Page = PAGES[page];

  return (
    <div className="app">
      <aside className="app-sidebar">
        <div className="set-side-head" data-drag><img src="/icons/apps/settings.svg" width={20} height={20} alt="" />设置</div>
        <button type="button" className="set-user" onClick={() => setPage('accounts')}>
          <Avatar size={44} />
          <div><div className="t-body-strong">{user}</div><div className="t-caption c-2">本地账户 · 管理员</div></div>
        </button>
        <TextField pill fieldClassName="set-search" value={query} onChange={setQuery} clearable prefix={<Search16Regular />} placeholder="查找设置" />
        <nav className="set-nav scroll">
          {pages.map(p => (
            <NavItem key={p.id} active={p.id === page} icon={ICONS[p.id][0]} iconActive={ICONS[p.id][1]} label={p.name} onClick={() => setPage(p.id)} />
          ))}
          {pages.length === 0 && <div className="t-caption c-3" style={{ padding: 12 }}>没有匹配的设置</div>}
        </nav>
      </aside>
      <section className="app-pane">
        <header className="set-head">
          <ProgressiveBlur side="top" size={116} strength={12} />
          <div className="set-head-bg" />
          <div className="set-head-row" data-drag>
            <div className="set-title"><div><h1 className="t-title">{meta.name}</h1><span className="c-3">{meta.desc}</span></div></div>
            <div className="set-head-bar chrome-bar"><Caption /></div>
          </div>
        </header>
        <div className="set-scroll scroll" key={page}>
          <div className="set-content"><Page go={setPage} /></div>
        </div>
      </section>
    </div>
  );
}

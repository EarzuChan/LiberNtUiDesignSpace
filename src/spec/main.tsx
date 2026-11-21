import { createRoot } from 'react-dom/client';
import '@/styles/tokens.css';
import '@/styles/base.css';
import '@/styles/materials.css';
import '@/styles/controls.css';
import '@/shell/shell.css';
import '@/shell/flyouts.css';
import '@/apps/files/files.css';
import '@/apps/settings/settings.css';
import './spec.css';
import { applySystemToDocument, useSys } from '@/lib/system';
import { startWallpaperSync } from '@/lib/wallpaperSync';
import { tr } from '@/i18n';
import { Spec } from './Spec';

applySystemToDocument();
const syncTitle = () => { document.title = tr('LiberNT 设计规范'); };
syncTitle();
useSys.subscribe(syncTitle);
useSys.subscribe(s => applySystemToDocument(s));
startWallpaperSync();
(window as unknown as { __lnt: unknown }).__lnt = { sys: useSys };

createRoot(document.getElementById('root')!).render(<Spec />);

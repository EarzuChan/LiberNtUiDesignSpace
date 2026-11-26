import { createRoot } from 'react-dom/client';
import '@/styles/tokens.css';
import '@/styles/base.css';
import '@/styles/materials.css';
import '@/styles/controls.css';
import { Desktop } from '@/shell/Desktop';
import { applySystemToDocument, useSys } from '@/lib/system';
import { useWm } from '@/lib/wm';
import { useFs } from '@/lib/fs';
import { useSession } from '@/lib/session';
import { startWallpaperSync } from '@/lib/wallpaperSync';

applySystemToDocument();
useSys.subscribe(s => applySystemToDocument(s));
startWallpaperSync();
// 首次访问：直接打开「设置 → 个性化」，让来访者一上来就能换主题、取色和壁纸。网址带 ?welcome 可强制重现
if (!useSys.getState().welcomed || new URLSearchParams(location.search).has('welcome')) {
  useWm.getState().launch('settings', { page: 'personalization' });
  useSys.getState().set({ welcomed: true });
}
// 调试/自动化入口
(window as unknown as { __lnt: unknown }).__lnt = { sys: useSys, wm: useWm, fs: useFs, session: useSession };

createRoot(document.getElementById('root')!).render(<Desktop />);

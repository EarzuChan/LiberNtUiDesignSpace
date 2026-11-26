import { createRoot } from 'react-dom/client';
import '@/styles/tokens.css';
import '@/styles/base.css';
import '@/styles/materials.css';
import '@/styles/controls.css';
import '@/shell/shell.css';
import { tr } from '@/i18n';
import { END_ACTIONS, useSession, type EndAction, type SessionPhase } from '@/lib/session';
import { applySystemToDocument, useSys } from '@/lib/system';
import { startWallpaperSync } from '@/lib/wallpaperSync';
import { MenuHost, TooltipHost } from '@/ui';
import { LoginUI } from './LoginUI';

/**
 * T2 场景页：锁屏、登录、睡眠、注销 / 重启 / 关机。
 * ?phase= 直接打开某个阶段：lock（默认）/ login / welcome / sleep / blocked / signout / restart / shutdown / update / off。
 * 由网址指定的阶段停在原地便于审阅；加 ?flow 则照常播放并衔接下一个场景。?pending= 指定 blocked 阶段被阻止的操作。
 */
const PHASES: SessionPhase[] = ['lock', 'login', 'welcome', 'sleep', 'blocked', 'off', ...END_ACTIONS];
const params = new URLSearchParams(location.search);
const phase = PHASES.find(p => p === params.get('phase'));
const pending = END_ACTIONS.find(a => a === params.get('pending')) ?? ('shutdown' satisfies EndAction);
useSession.setState({ phase: phase ?? 'lock', held: !!phase && !params.has('flow'), pending: phase === 'blocked' ? pending : null });

applySystemToDocument();
useSys.subscribe(s => applySystemToDocument(s));
startWallpaperSync();
document.title = tr('LiberNT');
(window as unknown as { __lnt: unknown }).__lnt = { sys: useSys, session: useSession };

createRoot(document.getElementById('root')!).render(<><LoginUI /><MenuHost /><TooltipHost /></>);

export type AppId =
  | 'files' | 'settings' | 'notepad' | 'photos' | 'calculator' | 'terminal'
  | 'edge' | 'store' | 'mail' | 'calendar' | 'music' | 'camera' | 'maps' | 'weather' | 'vscode' | 'paint' | 'todo'
  | 'monitor' | 'snip' | 'tips' | 'word' | 'excel' | 'powerpoint' | 'onenote' | 'github' | 'figma' | 'telegram'
  | 'wechat' | 'spotify' | 'steam' | 'discord' | 'obs' | 'blender' | 'security' | 'recorder' | 'sticky' | 'video' | 'netease' | 'qq' | 'notion';

export interface AppDef {
  id: AppId;
  name: string;
  icon: string;
  w: number;
  h: number;
  minW: number;
  minH: number;
  /** 单实例：再次启动时聚焦已有窗口 */
  single?: boolean;
  /** 窗口始终使用暗色材质（终端） */
  dark?: boolean;
  /** 是否有真实实现（否则显示启动画面占位） */
  builtin?: boolean;
  category: string;
}

const icon = (n: string) => `/icons/apps/${n}.svg`;
const def = (id: AppId, name: string, category: string, o: Partial<AppDef> = {}): AppDef => ({
  id, name, category, icon: icon(o.icon ?? id), w: 960, h: 640, minW: 420, minH: 320, single: true, ...o,
});

export const APPS: Record<AppId, AppDef> = Object.fromEntries(
  [
    def('files', '文件', '系统', { w: 1040, h: 660, minW: 560, minH: 380, single: false, builtin: true }),
    def('settings', '设置', '系统', { w: 1080, h: 720, minW: 640, minH: 440, builtin: true }),
    def('notepad', '记事本', '系统', { w: 760, h: 540, minW: 360, minH: 240, single: false, builtin: true }),
    def('photos', '照片', '系统', { w: 980, h: 660, minW: 480, minH: 360, builtin: true }),
    def('calculator', '计算器', '系统', { w: 340, h: 540, minW: 320, minH: 500, builtin: true }),
    def('terminal', '终端', '系统', { w: 820, h: 500, minW: 420, minH: 260, single: false, builtin: true, dark: true }),
    def('edge', 'Edge 浏览器', '网络'),
    def('store', '应用商店', '系统'),
    def('mail', '邮件', '效率'),
    def('calendar', '日历', '效率'),
    def('music', '音乐', '影音'),
    def('video', '影视', '影音'),
    def('camera', '相机', '影音'),
    def('recorder', '录音机', '影音'),
    def('maps', '地图', '工具'),
    def('weather', '天气', '工具'),
    def('paint', '画图', '创作'),
    def('todo', '待办', '效率'),
    def('sticky', '便笺', '效率'),
    def('monitor', '任务管理器', '系统'),
    def('snip', '截图工具', '工具'),
    def('tips', '使用技巧', '系统'),
    def('security', '安全中心', '系统'),
    def('word', 'Word', '效率'),
    def('excel', 'Excel', '效率'),
    def('powerpoint', 'PowerPoint', '效率'),
    def('onenote', 'OneNote', '效率'),
    def('vscode', 'Visual Studio Code', '开发'),
    def('github', 'GitHub Desktop', '开发'),
    def('figma', 'Figma', '创作'),
    def('blender', 'Blender', '创作'),
    def('obs', 'OBS Studio', '创作'),
    def('notion', 'Notion', '效率'),
    def('telegram', 'Telegram', '社交'),
    def('wechat', '微信', '社交'),
    def('qq', 'QQ', '社交'),
    def('discord', 'Discord', '社交'),
    def('spotify', 'Spotify', '影音'),
    def('netease', '网易云音乐', '影音'),
    def('steam', 'Steam', '游戏'),
  ].map(a => [a.id, a]),
) as Record<AppId, AppDef>;

export const DOCK_PINNED: AppId[] = ['files', 'edge', 'photos', 'notepad', 'terminal', 'calculator', 'store', 'settings'];
export const START_PINNED: AppId[] = [
  'edge', 'files', 'photos', 'settings', 'store', 'mail',
  'calendar', 'notepad', 'terminal', 'calculator', 'music', 'weather',
  'vscode', 'figma', 'word', 'excel', 'wechat', 'spotify',
];

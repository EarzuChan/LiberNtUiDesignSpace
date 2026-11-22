import { create } from 'zustand';
import { WALLPAPERS, wallpaperThumb, wallpaperUrl } from './wallpapers';

export type FileType =
  | 'folder' | 'text' | 'markdown' | 'image' | 'audio' | 'video' | 'pdf' | 'zip' | 'word' | 'excel' | 'powerpoint'
  | 'json' | 'html' | 'css' | 'typescript' | 'javascript' | 'python' | 'rust' | 'shell' | 'font' | 'svg' | 'psd' | 'iso' | 'exe' | 'drive' | 'link' | 'unknown';

export interface FsNode {
  id: string;
  name: string;
  type: FileType;
  parent: string | null;
  size?: number; // 字节
  modified: number; // 时间戳
  /** 文件夹/驱动器的专用图标 */
  icon?: string;
  /** 文本内容 */
  content?: string;
  /** 图片：缩略图与原图 */
  thumb?: string;
  src?: string;
  /** 快捷方式指向的网址 */
  href?: string;
  /** 驱动器容量（GB） */
  capacity?: { used: number; total: number };
}

const NOW = Date.now();
const H = 3600_000, D = 24 * H;
const nodes: Record<string, FsNode> = {};

function add(parent: string | null, name: string, type: FileType, o: Partial<FsNode> = {}): string {
  const id = o.id ?? (parent ? `${parent}/${name}` : name);
  nodes[id] = { id, name, type, parent, modified: NOW - Math.round(Math.random() * 40 * D), ...o };
  return id;
}
const KB = 1024, MB = 1024 * KB, GB = 1024 * MB;
const place = (n: string) => `/icons/places/${n}.svg`;

// ---------- 结构 ----------
add(null, '此电脑', 'folder', { id: 'pc', icon: '/icons/devices/computer.svg' });
add('pc', '系统 (C:)', 'drive', { id: 'c', icon: '/icons/devices/ssd.svg', capacity: { used: 186, total: 512 } });
add('pc', '数据 (D:)', 'drive', { id: 'd', icon: '/icons/devices/drive.svg', capacity: { used: 1280, total: 2000 } });
add('pc', 'LIBER-USB (E:)', 'drive', { id: 'e', icon: '/icons/devices/usb.svg', capacity: { used: 21, total: 64 } });
add(null, '网络', 'folder', { id: 'network', icon: place('network') });
add(null, '回收站', 'folder', { id: 'trash', icon: place('trash') });

add('c', '用户', 'folder', { id: 'users' });
add('c', 'LiberNT', 'folder', { id: 'c/system', icon: place('folder-apps') });
add('c', '应用程序', 'folder', { id: 'c/apps', icon: place('folder-apps') });
add('users', 'Earzu', 'folder', { id: 'home', icon: place('home') });
add('home', '桌面', 'folder', { id: 'desktop', icon: place('desktop'), modified: NOW - 2 * H });
add('home', '文档', 'folder', { id: 'documents', icon: place('folder-documents'), modified: NOW - 5 * H });
add('home', '下载', 'folder', { id: 'downloads', icon: place('folder-downloads'), modified: NOW - 1 * H });
add('home', '图片', 'folder', { id: 'pictures', icon: place('folder-pictures'), modified: NOW - 3 * D });
add('home', '音乐', 'folder', { id: 'music', icon: place('folder-music'), modified: NOW - 12 * D });
add('home', '视频', 'folder', { id: 'videos', icon: place('folder-videos'), modified: NOW - 20 * D });
add('home', '项目', 'folder', { id: 'projects', icon: place('folder-projects'), modified: NOW - 30 * 60_000 });

// ---------- 桌面 ----------
add('desktop', '设计系统', 'link', { id: 'desktop/design-system', icon: '/icons/apps/personalize.svg', href: '/spec.html', size: 1 * KB, modified: NOW - 20 * 60_000 });
add('desktop', 'LiberNT 设计规范.md', 'markdown', {
  size: 6 * KB, modified: NOW - 40 * 60_000,
  content: `# LiberNT Design Spec (draft)

> Fluent as the skeleton, with a more restrained, more translucent material as its character.

## Principles
1. Content first: the shell steps back so the wallpaper and content lead.
2. Grounded materials: opacity and tint adapt to backdrop luminance; foreground colors follow the system light/dark mode.
3. Clear hierarchy: blur, shadow and hairlines express depth instead of heavy borders.
4. Restrained motion: enter fast and settle gently, exit promptly; springs only on directly manipulated objects.
5. Sourced color: the accent is extracted from the wallpaper and solid surfaces carry a hint of it.

## Quick reference
- Spacing: 4px grid (2 / 4 / 6 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64)
- Radius: two extremes by role. Structural 4–12 (controls 4 · list items 5 · cards/menus 8 · windows 12) · floating 16–28 (widgets 20 · flyouts 28) · small controls fully round
- Type ramp: 12 / 14 / 16 / 20 / 28 / 40 / 68
- Control heights: 24 / 32 / 40

See the standalone spec page (/spec.html) for everything.
`,
  });
add('desktop', '路线图.xlsx', 'excel', { size: 48 * KB, modified: NOW - 2 * D });
add('desktop', '灵感', 'folder', { modified: NOW - 4 * D });
add('desktop/灵感', '材质参考.md', 'markdown', { size: 2 * KB, content: '# Material Notes\n\n- Thin glass: desktop widgets\n- Regular glass: dock, tray\n- Thick glass: Start menu, menus, tooltips\n- Mica: window base\n' });

// ---------- 文档 ----------
add('documents', '工作', 'folder', { modified: NOW - 6 * D });
add('documents', '读书笔记', 'folder', { modified: NOW - 15 * D });
add('documents', '2026 年度总结.docx', 'word', { size: 284 * KB, modified: NOW - 5 * H });
add('documents', '产品发布会.pptx', 'powerpoint', { size: 18.4 * MB, modified: NOW - 1 * D });
add('documents', '预算表 Q4.xlsx', 'excel', { size: 96 * KB, modified: NOW - 3 * D });
add('documents', '合同扫描件.pdf', 'pdf', { size: 2.3 * MB, modified: NOW - 9 * D });
add('documents', '会议纪要.txt', 'text', { size: 3 * KB, modified: NOW - 26 * H, content: 'Weekly sync, November 20\n\n1. Window chrome finalized: radius 12, mica base + solid content pane.\n2. The dock is a floating capsule and becomes a full-width bar when a window is maximized.\n3. Control center sliders switch to the fat-track style.\n\nTo do:\n- [ ] Add a dark-mode contrast check\n- [ ] Write up the icon size guidelines\n' });
add('documents', 'tokens.json', 'json', { size: 12 * KB, modified: NOW - 2 * D, content: '{\n  "radius": { "control": 4, "item": 5, "card": 8, "menu": 8, "window": 12, "flyout": 28, "pill": 999 },\n  "space": [0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64],\n  "motion": { "fast": 140, "normal": 220, "gentle": 320, "slow": 480 }\n}\n' });
add('documents/工作', '周报模板.docx', 'word', { size: 42 * KB });
add('documents/工作', '需求清单.xlsx', 'excel', { size: 77 * KB });
add('documents/读书笔记', '设计中的设计.md', 'markdown', { size: 5 * KB, content: '# Designing Design\n\nLook at familiar things as if they were unfamiliar.\n' });

// ---------- 下载 ----------
add('downloads', 'LiberNT-26.11-x64.iso', 'iso', { size: 5.2 * GB, modified: NOW - 1 * H });
add('downloads', 'fluent-icons.zip', 'zip', { size: 38.6 * MB, modified: NOW - 4 * H });
add('downloads', 'HarmonyOS_Sans.ttf', 'font', { size: 9.8 * MB, modified: NOW - 2 * D });
add('downloads', 'installer-setup.exe', 'exe', { size: 124 * MB, modified: NOW - 3 * D });
add('downloads', '发票-202611.pdf', 'pdf', { size: 186 * KB, modified: NOW - 6 * D });
add('downloads', 'keynote-录屏.mp4', 'video', { size: 842 * MB, modified: NOW - 8 * D });

// ---------- 图片 ----------
add('pictures', '壁纸', 'folder', { id: 'pictures/wallpapers', icon: place('folder-pictures'), modified: NOW - 3 * D });
add('pictures', '截图', 'folder', { modified: NOW - 7 * D });
WALLPAPERS.forEach((wp, i) => {
  for (const f of wp.dark ? [wp.light, wp.dark] : [wp.light]) {
    const label = wp.dark ? `${wp.name}${f.endsWith('dark') ? '·夜' : '·昼'}` : wp.name;
    add('pictures/wallpapers', `${label}.webp`, 'image', { size: (0.6 + ((i * 37) % 10) / 9) * MB, thumb: wallpaperThumb(f), src: wallpaperUrl(f), modified: NOW - (i + 2) * D });
  }
});
(['valley', 'tide', 'canyon', 'dahlia', 'petal', 'starlight'] as const).forEach((f, i) => {
  const names = ['优胜美地.webp', '海岸线.webp', '羚羊峡谷.webp', '大丽花.webp', '向日葵.webp', '半穹顶之夜.webp'];
  add('pictures', names[i], 'image', { size: (1.1 + i * 0.37) * MB, thumb: wallpaperThumb(f), src: wallpaperUrl(f), modified: NOW - (i * 3 + 1) * D });
});
add('pictures', 'logo.svg', 'svg', { size: 2 * KB, modified: NOW - 11 * D });
add('pictures', '海报-终稿.psd', 'psd', { size: 212 * MB, modified: NOW - 13 * D });

// ---------- 音乐 / 视频 ----------
['晨间漫步.flac', 'Night Drive.mp3', '雨后.flac', 'Blue Hour.mp3', '潮汐.m4a'].forEach((n, i) => add('music', n, 'audio', { size: (8 + i * 6.3) * MB }));
['旅行 Vlog.mp4', '产品演示.mov', '延时摄影.mp4'].forEach((n, i) => add('videos', n, 'video', { size: (320 + i * 410) * MB }));

// ---------- 项目 ----------
add('projects', 'libernt-shell', 'folder', { icon: place('folder-github'), modified: NOW - 30 * 60_000 });
add('projects', 'design-tokens', 'folder', { modified: NOW - 2 * D });
add('projects/libernt-shell', 'src', 'folder');
add('projects/libernt-shell', 'README.md', 'markdown', { size: 3 * KB, content: '# libernt-shell\n\nThe LiberNT desktop shell.\n\n```\npnpm dev\n```\n' });
add('projects/libernt-shell', 'package.json', 'json', { size: 1 * KB, content: '{\n  "name": "libernt-shell",\n  "version": "26.11.0"\n}\n' });
add('projects/libernt-shell', 'vite.config.ts', 'typescript', { size: 1 * KB, content: "import { defineConfig } from 'vite';\n\nexport default defineConfig({});\n" });
add('projects/libernt-shell/src', 'main.tsx', 'typescript', { size: 2 * KB, content: "import { createRoot } from 'react-dom/client';\n" });
add('projects/libernt-shell/src', 'shell.css', 'css', { size: 14 * KB, content: '.dock { border-radius: var(--radius-pill); }\n' });
add('projects/design-tokens', 'tokens.css', 'css', { size: 11 * KB, content: ':root {\n  --radius-window: 12px;\n}\n' });
add('projects/design-tokens', 'build.py', 'python', { size: 2 * KB, content: 'print("build tokens")\n' });
add('projects/design-tokens', 'export.sh', 'shell', { size: 1 * KB, content: '#!/bin/sh\necho export\n' });

// ---------- 其他盘 ----------
add('d', '素材库', 'folder'); add('d', '备份', 'folder'); add('d', '虚拟机', 'folder'); add('d', '游戏', 'folder', { icon: place('folder-games') });
add('e', '照片备份', 'folder'); add('e', 'LiberNT-26.11-x64.iso', 'iso', { size: 5.2 * GB });
add('c/system', 'System', 'folder'); add('c/system', 'Fonts', 'folder'); add('c/system', 'explorer.exe', 'exe', { size: 5.6 * MB });
add('trash', '旧版草稿.docx', 'word', { size: 120 * KB, modified: NOW - 18 * D });
add('trash', '未命名.png', 'image', { size: 1.4 * MB, thumb: wallpaperThumb('meadow'), src: wallpaperUrl('meadow'), modified: NOW - 22 * D });

// ---------- Store ----------
interface FsState {
  nodes: Record<string, FsNode>;
  children: (id: string) => FsNode[];
  createFolder: (parent: string) => string;
  rename: (id: string, name: string) => void;
  write: (id: string, content: string) => void;
  remove: (ids: string[]) => void;
  move: (ids: string[], parent: string) => void;
  copy: (ids: string[], parent: string) => void;
  createFile: (parent: string, name: string, type: FileType, content: string) => string;
}

export const useFs = create<FsState>()((set, get) => ({
  nodes,
  children: id => Object.values(get().nodes).filter(n => n.parent === id),
  createFolder(parent) {
    const s = get();
    const names = new Set(s.children(parent).map(n => n.name));
    let name = '新建文件夹', i = 2;
    while (names.has(name)) name = `新建文件夹 (${i++})`;
    const id = `${parent}/${name}#${Date.now()}`;
    set({ nodes: { ...s.nodes, [id]: { id, name, type: 'folder', parent, modified: Date.now() } } });
    return id;
  },
  rename: (id, name) => set(s => ({ nodes: { ...s.nodes, [id]: { ...s.nodes[id], name, modified: Date.now() } } })),
  move: (ids, parent) => set(s => {
    const next = { ...s.nodes };
    for (const id of ids) if (next[id] && id !== parent && !pathOf(parent, next).some(p => p.id === id)) next[id] = { ...next[id], parent };
    return { nodes: next };
  }),
  copy(ids, parent) {
    const next = { ...get().nodes };
    const clone = (id: string, to: string) => {
      const n = next[id];
      if (!n) return;
      const nid = `${to}/${n.name}#${Math.random().toString(36).slice(2, 8)}`;
      const kids = Object.values(next).filter(c => c.parent === id);
      next[nid] = { ...n, id: nid, parent: to, name: n.parent === to ? n.name.replace(/(\.[^.]+)?$/, ' - 副本$1') : n.name, modified: Date.now() };
      kids.forEach(k => clone(k.id, nid));
    };
    ids.forEach(id => clone(id, parent));
    set({ nodes: next });
  },
  createFile(parent, name, type, content) {
    const id = `${parent}/${name}#${Date.now()}`;
    set(s => ({ nodes: { ...s.nodes, [id]: { id, name, type, parent, content, size: new Blob([content]).size, modified: Date.now() } } }));
    return id;
  },
  write: (id, content) => set(s => ({ nodes: { ...s.nodes, [id]: { ...s.nodes[id], content, size: new Blob([content]).size, modified: Date.now() } } })),
  /** 移入回收站；已在回收站中的则彻底删除 */
  remove(ids) {
    const next = { ...get().nodes };
    for (const id of ids) {
      const n = next[id];
      if (!n) continue;
      if (n.parent === 'trash') delete next[id];
      else next[id] = { ...n, parent: 'trash', icon: undefined };
    }
    set({ nodes: next });
  },
}));

export const isContainer = (n: FsNode) => n.type === 'folder' || n.type === 'drive';

export function pathOf(id: string, all: Record<string, FsNode> = useFs.getState().nodes): FsNode[] {
  const out: FsNode[] = [];
  for (let n: FsNode | undefined = all[id]; n; n = n.parent ? all[n.parent] : undefined) out.unshift(n);
  return out;
}

const MIME_ICON: Partial<Record<FileType, string>> = {
  text: 'text', markdown: 'markdown', image: 'image', audio: 'audio', video: 'video', pdf: 'pdf', zip: 'zip', word: 'word', excel: 'excel',
  powerpoint: 'powerpoint', json: 'json', html: 'html', css: 'css', typescript: 'typescript', javascript: 'javascript', python: 'python',
  rust: 'rust', shell: 'shell', font: 'font', svg: 'svg', psd: 'psd', iso: 'iso', exe: 'exe', unknown: 'unknown',
};
export function iconOf(n: FsNode): string {
  if (n.icon) return n.icon;
  if (n.id === 'trash') return '/icons/places/trash.svg';
  if (n.type === 'folder') return '/icons/places/folder.svg';
  if (n.type === 'drive') return '/icons/devices/drive.svg';
  return `/icons/mimetypes/${MIME_ICON[n.type] ?? 'unknown'}.svg`;
}

const TYPE_LABEL: Record<FileType, string> = {
  folder: '文件夹', text: '文本文档', markdown: 'Markdown 文档', image: '图像', audio: '音频文件', video: '视频文件', pdf: 'PDF 文档', zip: '压缩文件',
  word: 'Word 文档', excel: 'Excel 工作表', powerpoint: 'PowerPoint 演示文稿', json: 'JSON 文件', html: 'HTML 文档', css: 'CSS 样式表',
  typescript: 'TypeScript 源文件', javascript: 'JavaScript 源文件', python: 'Python 源文件', rust: 'Rust 源文件', shell: 'Shell 脚本',
  font: '字体文件', svg: 'SVG 图像', psd: 'Photoshop 文档', iso: '光盘映像', exe: '应用程序', drive: '本地磁盘', link: '快捷方式', unknown: '文件',
};
export const typeLabel = (n: FsNode) => TYPE_LABEL[n.type];

export function formatSize(b?: number): string {
  if (b === undefined) return '';
  if (b < KB) return `${b} B`;
  if (b < MB) return `${Math.round(b / KB)} KB`;
  if (b < GB) return `${(b / MB).toFixed(b < 10 * MB ? 1 : 0)} MB`;
  return `${(b / GB).toFixed(1)} GB`;
}

export function formatTime(t: number): string {
  const d = new Date(t), now = new Date();
  const diff = now.getTime() - t;
  if (diff < 60_000) return '刚刚';
  if (diff < H) return `${Math.floor(diff / 60_000)} 分钟前`;
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (d.toDateString() === now.toDateString()) return `今天 ${hm}`;
  if (diff < 2 * D && new Date(now.getTime() - D).toDateString() === d.toDateString()) return `昨天 ${hm}`;
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${hm}`;
}

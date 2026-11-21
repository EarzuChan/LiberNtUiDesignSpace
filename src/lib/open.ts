import { isContainer, type FsNode } from './fs';
import { useWm } from './wm';
import type { AppId } from './apps';

const TEXT_TYPES = new Set(['text', 'markdown', 'json', 'html', 'css', 'typescript', 'javascript', 'python', 'rust', 'shell']);
const VIEWER: Partial<Record<FsNode['type'], AppId>> = { word: 'word', excel: 'excel', powerpoint: 'powerpoint', pdf: 'edge', video: 'video', audio: 'music', svg: 'paint', psd: 'paint' };

/** 按类型打开文件系统节点 */
export function openNode(n: FsNode) {
  const wm = useWm.getState();
  if (n.href) window.open(n.href, '_blank');
  else if (isContainer(n)) wm.open('files', { path: n.id });
  else if (n.type === 'image') wm.launch('photos', { id: n.id });
  else if (TEXT_TYPES.has(n.type)) wm.open('notepad', { id: n.id });
  else if (VIEWER[n.type]) wm.launch(VIEWER[n.type]!);
}

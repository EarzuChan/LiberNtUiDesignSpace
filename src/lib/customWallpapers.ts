/** 用户上传的壁纸：原图存在浏览器的 IndexedDB 里，不会上传到任何地方 */
export interface CustomWallpaper { id: string; name: string; url: string; thumb: string; w: number; h: number }
interface Stored { id: string; name: string; blob: Blob; thumb: string; w: number; h: number; added: number }

let list: CustomWallpaper[] = [];
let loaded: Promise<void> | null = null;

function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('lnt-wallpapers', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('items', { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
const tx = <T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>) =>
  db().then(d => new Promise<T>((resolve, reject) => {
    const req = run(d.transaction('items', mode).objectStore('items'));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));

const expose = (s: Stored): CustomWallpaper => ({ id: s.id, name: s.name, url: URL.createObjectURL(s.blob), thumb: s.thumb, w: s.w, h: s.h });

export const customWallpapers = () => list;
export const findCustomWallpaper = (id: string) => list.find(w => w.id === id);

export function loadCustomWallpapers(): Promise<void> {
  loaded ??= tx<Stored[]>('readonly', s => s.getAll())
    .then(items => { list = items.sort((a, b) => a.added - b.added).map(expose); })
    .catch(() => { list = []; });
  return loaded;
}

export async function addCustomWallpaper(file: Blob, name: string): Promise<CustomWallpaper> {
  const bmp = await createImageBitmap(file);
  const tw = 640, th = Math.max(1, Math.round((640 * bmp.height) / bmp.width));
  const c = Object.assign(document.createElement('canvas'), { width: tw, height: th });
  c.getContext('2d')!.drawImage(bmp, 0, 0, tw, th);
  const stored: Stored = { id: `custom:${Date.now().toString(36)}`, name, blob: file, thumb: c.toDataURL('image/jpeg', 0.82), w: bmp.width, h: bmp.height, added: Date.now() };
  bmp.close();
  await tx('readwrite', s => s.put(stored));
  const wp = expose(stored);
  list = [...list, wp];
  return wp;
}

export async function removeCustomWallpaper(id: string) {
  const wp = findCustomWallpaper(id);
  if (wp) URL.revokeObjectURL(wp.url);
  list = list.filter(w => w.id !== id);
  await tx('readwrite', s => s.delete(id));
}

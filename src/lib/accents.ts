/** 强调色：OKLCH 的色相 h、色度 c，以及亮色模式下的基准明度 l */
export interface AccentColor { h: number; c: number; l: number }
export interface Accent extends AccentColor { id: string; name: string }

export const ACCENTS: Accent[] = [
  { id: 'azure', name: '天青', h: 255, c: 0.19, l: 0.56 },
  { id: 'indigo', name: '靛蓝', h: 277, c: 0.2, l: 0.54 },
  { id: 'violet', name: '堇紫', h: 302, c: 0.2, l: 0.55 },
  { id: 'pink', name: '品红', h: 352, c: 0.2, l: 0.58 },
  { id: 'red', name: '绯红', h: 25, c: 0.2, l: 0.57 },
  { id: 'orange', name: '橘橙', h: 48, c: 0.18, l: 0.62 },
  { id: 'amber', name: '琥珀', h: 76, c: 0.15, l: 0.66 },
  { id: 'green', name: '翠绿', h: 150, c: 0.16, l: 0.56 },
  { id: 'teal', name: '青碧', h: 190, c: 0.11, l: 0.56 },
  { id: 'graphite', name: '石墨', h: 260, c: 0.02, l: 0.5 },
];

export const findAccent = (id: string) => ACCENTS.find(a => a.id === id) ?? ACCENTS[0];
export const accentCss = (a: AccentColor) => `oklch(${a.l} ${a.c} ${a.h})`;

/**
 * 亮色模式下强调色的基准明度随色相变化：黄、青柠一带（h≈60–130）在低明度下发脏，
 * 需要提亮；提亮后其上的文字改用深色以保证对比度。
 */
export function lightnessFor(h: number): number {
  const d = Math.abs(((h - 95 + 540) % 360) - 180);
  return +(0.56 + 0.12 * Math.max(0, 1 - d / 55)).toFixed(3);
}

/** 强调色上的文字颜色（明度/色度）：强调色较亮时用深色字 */
export const inkFor = (a: AccentColor) => (a.l > 0.63 ? { l: 0.2, c: 0.04 } : { l: 1, c: 0 });

/**
 * 界面语言。
 *
 * 源码里的界面文案一律写简体中文；英文译文放在 ./en.ts（以中文原文为键）。
 * 翻译发生在渲染层：自定义 JSX 运行时（./jsx-runtime.ts，经 tsconfig 与 vite.config 的 jsxImportSource 启用）在创建原生元素时，
 * 把字符串子节点和 placeholder / title / alt / aria-label / data-tip 属性交给 tr() 处理。
 * 因此组件、数据、状态里流转的始终是中文原文，切换语言只需要重新渲染。
 *
 * 需要在渲染之外使用译文（搜索、排序、写入文本框）时，直接调用 tr()。
 * 词典里没有的字符串原样显示（中文），拼接出来的字符串由下方 RULES 处理。
 */
import { EN } from './en';

export type Lang = 'en' | 'zh';

// 在任何组件渲染之前就要确定语言，所以这里直接读持久化的系统设置
let lang: Lang = (() => {
  try {
    return JSON.parse(localStorage.getItem('lnt-sys-v1') ?? '{}').state?.lang === 'zh' ? 'zh' : 'en';
  } catch {
    return 'en';
  }
})();

export const getLang = () => lang;
export const setLang = (l: Lang) => { lang = l; };
export const locale = () => (lang === 'en' ? 'en-US' : 'zh-CN');

const HAN = /[\u4e00-\u9fff]/;
const CJK_PUNCT = /[\u3000-\u303f\uff00-\uffef]/g;
const DICT = new Map(Object.entries(EN));
const PUNCT: Record<string, string> = { '。': '.', '，': ', ', '、': ', ', '：': ': ', '；': '; ', '（': ' (', '）': ')', '！': '!', '？': '?', '　': '  ' };

const plural = (n: string, one: string, many: string) => `${n} ${Number(n) === 1 ? one : many}`;

/** 拼接字符串的翻译规则：按顺序匹配，捕获组里的中文递归翻译 */
const RULES: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^在 (.+) 中搜索$/, m => `Search ${tr(m[1])}`],
  [/^没有与“(.*)”匹配的项目$/, m => `No items match “${m[1]}”`],
  [/^已选择 (\d+) 个项目$/, m => `${plural(m[1], 'item', 'items')} selected`],
  [/^(\d+) 个项目$/, m => plural(m[1], 'item', 'items')],
  [/^(\d+) 个固定文件夹$/, m => plural(m[1], 'pinned folder', 'pinned folders')],
  [/^(.*) - (记事本|照片)$/, m => `${tr(m[1])} - ${tr(m[2])}`],
  [/^可被发现为“(.*)”$/, m => `Discoverable as “${m[1]}”`],
  [/^使用预设颜色 · (.+)$/, m => `Using a preset color · ${tr(m[1])}`],
  [/^随亮\/暗模式自动切换 · (.+)$/, m => `Switches with light/dark mode · ${m[1]}`],
  [/^当前壁纸偏亮，已压暗 (\d+)%$/, m => `This wallpaper is bright, so it is dimmed by ${m[1]}%`],
  [/^cd: 找不到目录：(.*)$/, m => `cd: no such directory: ${m[1]}`],
  [/^cat: 无法读取：(.*)$/, m => `cat: cannot read: ${m[1]}`],
  [/^open: 找不到：(.*)$/, m => `open: not found: ${m[1]}`],
  [/^liber-sh: 未找到命令：(.*)$/, m => `liber-sh: command not found: ${m[1]}`],
  [/^新建文件夹 \((\d+)\)$/, m => `New folder (${m[1]})`],
  [/^(\d+) 分钟前$/, m => `${m[1]} min ago`],
  [/^今天 (.+)$/, m => `Today ${m[1]}`],
  [/^昨天 (.+)$/, m => `Yesterday ${m[1]}`],
  [/^(.+)·(昼|夜)$/, m => `${tr(m[1])} (${m[2] === '昼' ? 'Day' : 'Night'})`],
  [/^(.*) - 副本$/, m => `${tr(m[1])} - Copy`],
  // 文件名：译出主名，保留扩展名
  [/^(.+)(\.[A-Za-z0-9]{1,5})$/, m => tr(m[1]) + m[2]],
];

const cache = new Map<string, string>();

function compose(s: string): string {
  const m = s.match(/^(\s*)([\s\S]*?)(\s*)$/)!;
  if ((m[1] || m[3]) && DICT.has(m[2])) return m[1] + DICT.get(m[2]) + m[3];
  for (const [re, fn] of RULES) {
    const hit = s.match(re);
    if (hit) return fn(hit);
  }
  for (const sep of [' › ', ' · ', ' / ', '/']) {
    if (!s.includes(sep)) continue;
    const parts = s.split(sep);
    const out = parts.map(tr);
    if (out.some((p, i) => p !== parts[i])) return out.join(sep);
  }
  return s.replace(CJK_PUNCT, c => PUNCT[c] ?? c);
}

/** 把中文原文译为当前语言；当前语言为中文、或字符串不含中文时原样返回 */
export function tr(s: string): string {
  if (lang !== 'en') return s;
  const hit = DICT.get(s);
  if (hit !== undefined) return hit;
  if (!(HAN.test(s) || s.search(CJK_PUNCT) >= 0)) return s;
  let out = cache.get(s);
  if (out === undefined) {
    out = compose(s);
    if (cache.size > 4000) cache.clear();
    cache.set(s, out);
  }
  return out;
}

/** 按当前语言下的显示文本比较（排序用） */
export const cmpText = (a: string, b: string) => tr(a).localeCompare(tr(b), lang, { numeric: true });
/** 关键字是否命中原文或译文（q 需已转小写） */
export const matchText = (text: string, q: string) => text.toLowerCase().includes(q) || tr(text).toLowerCase().includes(q);

const ATTRS = ['placeholder', 'title', 'alt', 'aria-label', 'data-tip'] as const;

function localizeNode(n: unknown): unknown {
  if (typeof n === 'string') return tr(n);
  if (!Array.isArray(n)) return n;
  let copy: unknown[] | null = null;
  for (let i = 0; i < n.length; i++) {
    const t = localizeNode(n[i]);
    if (t !== n[i]) (copy ??= n.slice())[i] = t;
  }
  return copy ?? n;
}

/** 供 JSX 运行时调用：翻译原生元素的文本子节点与文案类属性 */
export function localizeProps<P>(props: P): P {
  if (lang !== 'en' || !props || typeof props !== 'object') return props;
  const src = props as Record<string, unknown>;
  let out: Record<string, unknown> | null = null;
  const children = localizeNode(src.children);
  if (children !== src.children) (out ??= { ...src }).children = children;
  for (const a of ATTRS) {
    const v = src[a];
    if (typeof v !== 'string') continue;
    const t = tr(v);
    if (t !== v) (out ??= { ...src })[a] = t;
  }
  return (out ?? src) as P;
}

// 注册给 JSX 运行时使用（见 ./jsx-runtime.ts 顶部的说明）
(globalThis as { __lntLocalize?: typeof localizeProps }).__lntLocalize = localizeProps;

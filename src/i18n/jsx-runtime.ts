// 自定义 JSX 运行时：在创建原生元素（和 Fragment）时翻译文本，其余原样转交给 React。
// 注意：本文件会被 Vite 当作依赖预打包，所以不能直接 import ./index（否则会得到一份独立的语言状态），
// 而是通过 globalThis.__lntLocalize 取得翻译函数（由 ./index.ts 注册）。
import { Fragment, jsx as reactJsx, jsxs as reactJsxs } from 'react/jsx-runtime';

export type { JSX } from 'react/jsx-runtime';
export { Fragment };

type Localize = <P>(props: P) => P;
const localize = <P>(type: unknown, props: P): P => {
  const fn = (globalThis as { __lntLocalize?: Localize }).__lntLocalize;
  return fn && (typeof type === 'string' || type === Fragment) ? fn(props) : props;
};

export const jsx: typeof reactJsx = (type, props, key) => reactJsx(type, localize(type, props), key);
export const jsxs: typeof reactJsxs = (type, props, key) => reactJsxs(type, localize(type, props), key);

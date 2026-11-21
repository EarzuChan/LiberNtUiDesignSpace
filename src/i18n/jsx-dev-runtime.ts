// 开发模式下的 JSX 运行时，逻辑同 ./jsx-runtime.ts（同样不能直接 import ./index）
import { Fragment, jsxDEV as reactJsxDEV } from 'react/jsx-dev-runtime';

export type { JSX } from 'react/jsx-runtime';
export { Fragment };

type Localize = <P>(props: P) => P;

export const jsxDEV: typeof reactJsxDEV = (type, props, ...rest) => {
  const fn = (globalThis as { __lntLocalize?: Localize }).__lntLocalize;
  return reactJsxDEV(type, fn && (typeof type === 'string' || type === Fragment) ? fn(props) : props, ...rest);
};

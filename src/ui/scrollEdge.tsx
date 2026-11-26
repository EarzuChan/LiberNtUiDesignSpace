import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/**
 * 滚动上缘：内容往下滚过之后，在裁切处出现一条切线和向下的一道浅阴影，滚回顶端时消失。
 * 用于与列表同层、本来浑然一体的顶部控件之下（侧栏、开始菜单列表）；浮在内容上的标题区改用 ProgressiveBlur。
 * 返回 [挂到滚动容器上的 ref, 边缘层]；边缘层须作为滚动容器的兄弟节点渲染，按滚动容器的位置绝对定位，不影响布局。
 * full：横向铺满所在的定位容器（列表本身带内边距、切线要贯通整块表面时用，如开始菜单）。
 */
export function useScrollEdge<T extends HTMLElement = HTMLElement>({ full = false } = {}): [(el: T | null) => void, ReactNode] {
  const [el, setEl] = useState<T | null>(null);
  const edge = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const e = edge.current;
    if (!el || !e) return;
    const place = () => Object.assign(e.style, full ? { top: `${el.offsetTop}px`, left: '0', right: '0' } : { top: `${el.offsetTop}px`, left: `${el.offsetLeft}px`, width: `${el.offsetWidth}px` });
    const scrolled = () => { e.dataset.on = String(el.scrollTop > 0); };
    place();
    scrolled();
    el.addEventListener('scroll', scrolled, { passive: true });
    const ro = new ResizeObserver(place);
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
    // 祖先做位移动画期间，它会临时成为定位参照（offsetParent 随之变化），动画结束后要重新对位
    window.addEventListener('animationend', place, true);
    return () => { el.removeEventListener('scroll', scrolled); ro.disconnect(); window.removeEventListener('animationend', place, true); };
  }, [el, full]);
  return [setEl, <i ref={edge} className="scroll-edge" aria-hidden />];
}

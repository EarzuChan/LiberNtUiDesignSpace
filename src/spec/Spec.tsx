import { useEffect, useRef, useState } from 'react';
import { ACCENTS } from '@/lib/accents';
import { useSys } from '@/lib/system';
import { Button, MenuHost, NavItem, Segmented, TooltipHost } from '@/ui';
import { Logo } from '@/ui/Logo';
import { Desktop16Regular, WeatherMoon16Regular, WeatherSunny16Regular } from '@/ui/icons';
import { ColorSection, OverviewSection } from './sections/Foundations';
import { ElevationSection, RadiusSection, SpacingSection, TypeSection } from './sections/Metrics';
import { MaterialSection, MotionSection } from './sections/Materials';
import { IconSection } from './sections/Icons';
import { ControlSection } from './sections/Controls';
import { ShellSection } from './sections/Shell';
import { ScenesSection } from './sections/Scenes';

const NAV: [string, [string, string][]][] = [
  ['基础', [['overview', '概述'], ['color', '颜色'], ['type', '字体'], ['spacing', '间距与尺寸'], ['radius', '圆角'], ['elevation', '阴影与层级']]],
  ['质感', [['material', '材质'], ['motion', '动效'], ['icons', '图标']]],
  ['组件', [['controls', '控件'], ['shell', '窗口与外壳'], ['scenes', '系统场景']]],
];

export function Spec() {
  const s = useSys();
  const main = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState('overview');

  useEffect(() => {
    const el = main.current!;
    const on = () => {
      let cur = 'overview';
      for (const sec of el.querySelectorAll<HTMLElement>('section[id]')) if (sec.getBoundingClientRect().top < 160) cur = sec.id;
      setActive(cur);
    };
    el.addEventListener('scroll', on, { passive: true });
    return () => el.removeEventListener('scroll', on);
  }, []);

  return (
    <div className="spec">
      <aside className="spec-side">
        <div className="spec-brand"><Logo size={36} /><div><b>LiberNT 设计规范</b><span>26.11 · 草案</span></div></div>
        <nav className="spec-nav scroll">
          {NAV.map(([group, items]) => (
            <div key={group} className="col" style={{ gap: 2 }}>
              <div className="spec-nav-title">{group}</div>
              {items.map(([id, label]) => (
                <NavItem key={id} label={label} active={active === id} onClick={() => document.getElementById(id)?.scrollIntoView()} />
              ))}
            </div>
          ))}
        </nav>
        <div className="spec-side-foot">
          <Segmented value={s.lang} onChange={s.setLanguage} options={[{ value: 'en', label: 'English' }, { value: 'zh', label: '中文' }]} />
          <Segmented value={s.theme} onChange={v => s.set({ theme: v })} options={[{ value: 'light', label: '亮色', icon: <WeatherSunny16Regular /> }, { value: 'dark', label: '暗色', icon: <WeatherMoon16Regular /> }]} />
          <div className="swatches" style={{ gap: 6, padding: '0 2px', justifyContent: 'flex-start' }}>
            <button type="button" className="swatch" style={{ width: 18, height: 18, outlineOffset: 1, background: 'conic-gradient(from 210deg, #4cd2ff, #8b6cf0, #f0629b, #f5a524, #30b46c, #4cd2ff)' }} aria-checked={s.accentMode === 'wallpaper'} data-tip="跟随壁纸" onClick={() => s.set({ accentMode: 'wallpaper' })} />
            {ACCENTS.map(a => (
              <button key={a.id} type="button" className="swatch" style={{ width: 18, height: 18, background: `oklch(${a.l} ${a.c} ${a.h})`, outlineOffset: 1 }} aria-checked={s.accentMode === 'preset' && a.id === s.accent} data-tip={a.name} onClick={() => s.set({ accent: a.id, accentMode: 'preset' })} />
            ))}
          </div>
          <Button icon={<Desktop16Regular />} onClick={() => (location.href = '/')}>打开桌面 Demo</Button>
        </div>
      </aside>
      <main className="spec-main scroll" ref={main}>
        <div className="spec-inner">
          <OverviewSection />
          <ColorSection />
          <TypeSection />
          <SpacingSection />
          <RadiusSection />
          <ElevationSection />
          <MaterialSection />
          <MotionSection />
          <IconSection />
          <ControlSection />
          <ShellSection />
          <ScenesSection />
        </div>
      </main>
      <MenuHost />
      <TooltipHost />
    </div>
  );
}

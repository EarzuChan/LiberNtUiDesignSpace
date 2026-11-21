import { useEffect, useState } from 'react';
import { Glass } from '@/ui';
import { Location12Filled } from '@/ui/icons';
import { fmtMonth, useNow, weekday } from './hooks';

function Gauge({ value, label }: { value: number; label: string }) {
  const r = 21, c = 2 * Math.PI * r;
  return (
    <div className="w-gauge">
      <svg width="48" height="48" viewBox="0 0 54 54">
        <circle cx="27" cy="27" r={r} />
        <circle cx="27" cy="27" r={r} strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />
      </svg>
      <div><b>{Math.round(value)}%</b><span className="widget-label">{label}</span></div>
    </div>
  );
}

/** 桌面小组件：薄玻璃，直接采样壁纸亮度做自适应 */
export function Widgets() {
  const now = useNow(30_000);
  const [cpu, setCpu] = useState(18);
  useEffect(() => {
    const t = setInterval(() => setCpu(v => Math.min(92, Math.max(6, v + (Math.random() - 0.48) * 18))), 2200);
    return () => clearInterval(t);
  }, []);
  const week = Math.ceil(((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7);
  return (
    <div className="widgets">
      <Glass thickness="thin" layer="desktop" className="widget" noise>
        <span className="t-body-strong c-accent">{weekday(now)}</span>
        <span className="w-date-day tnum">{now.getDate()}</span>
        <span className="grow" />
        <span className="t-body-strong">{fmtMonth(now)}</span>
        <span className="widget-label">第 {week} 周 · 今天没有日程</span>
      </Glass>
      <Glass thickness="thin" layer="desktop" className="widget" noise>
        <span className="t-body-strong row gap-4">上海<Location12Filled className="c-2" /></span>
        <span className="w-weather-temp tnum">18°</span>
        <img className="w-weather-emoji" src="/emoji/sun_behind_cloud.png" alt="" />
        <span className="grow" />
        <span className="t-body-strong">多云转晴</span>
        <span className="widget-label">最高 21° · 最低 14°</span>
      </Glass>
      <Glass thickness="thin" layer="desktop" className="widget widget-wide" noise style={{ height: 112 }}>
        <div className="w-sys">
          <Gauge value={cpu} label="处理器" />
          <Gauge value={61} label="内存" />
          <Gauge value={36} label="存储" />
        </div>
      </Glass>
    </div>
  );
}

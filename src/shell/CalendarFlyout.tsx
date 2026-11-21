import { useState } from 'react';
import { APPS, type AppId } from '@/lib/apps';
import { Button, Glass } from '@/ui';
import { ChevronDown16Regular, ChevronUp16Regular, Dismiss12Regular } from '@/ui/icons';
import { fmtDateLong, fmtMonth, useFlyout, useNow } from './hooks';

interface Notice { id: number; app: AppId; time: string; title: string; body: string }
const INITIAL: Notice[] = [
  { id: 1, app: 'mail', time: '18:21', title: '林澈', body: '新版窗口外壳的标注我放到共享文件夹了，有空看一下圆角和阴影。' },
  { id: 2, app: 'store', time: '17:05', title: '3 个应用已更新', body: '照片、记事本和终端已更新到最新版本。' },
  { id: 3, app: 'security', time: '09:30', title: '设备状态良好', body: '上次扫描未发现威胁，无需执行任何操作。' },
];

export function CalendarFlyout() {
  const { show, state } = useFlyout('calendar');
  const now = useNow(30_000);
  const [notices, setNotices] = useState(INITIAL);
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selected, setSelected] = useState<string | null>(null);
  if (!show) return null;

  const start = new Date(month);
  start.setDate(1 - ((month.getDay() + 6) % 7)); // 周一起始
  const days = Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  const shift = (d: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + d, 1));

  return (
    <div className="flyout-group" data-state={state}>
      <Glass thickness="thick" className="flyout-panel notif" noise>
        <div className="notif-head">
          <span>通知</span>
          {notices.length > 0 && <Button variant="subtle" size="sm" onClick={() => setNotices([])}>全部清除</Button>}
        </div>
        {notices.length === 0 && <div className="notif-empty">没有新通知</div>}
        {notices.map(n => (
          <div key={n.id} className="cc-card notif-card">
            <div className="notif-card-head">
              <img src={APPS[n.app].icon} alt="" /><span>{APPS[n.app].name}</span><span className="notif-time tnum">{n.time}</span>
            </div>
            <div className="t-body-strong">{n.title}</div>
            <p>{n.body}</p>
            <Button variant="subtle" size="sm" iconOnly className="notif-x" icon={<Dismiss12Regular />} onClick={() => setNotices(notices.filter(x => x.id !== n.id))} />
          </div>
        ))}
      </Glass>
      <Glass thickness="thick" className="flyout-panel cal" noise>
        <div className="cal-today">
          <span className="t-body-strong">{fmtDateLong(now)}</span>
          <span className="t-caption c-2">农历十月十三</span>
        </div>
        <div className="cal-head">
          <span className="tnum">{fmtMonth(month)}</span>
          <span className="row gap-4">
            <Button variant="subtle" size="sm" iconOnly icon={<ChevronUp16Regular />} onClick={() => shift(-1)} />
            <Button variant="subtle" size="sm" iconOnly icon={<ChevronDown16Regular />} onClick={() => shift(1)} />
          </span>
        </div>
        <div className="cal-grid">
          {['一', '二', '三', '四', '五', '六', '日'].map(d => <span key={d}>{d}</span>)}
          {days.map(d => {
            const key = d.toDateString();
            return (
              <button
                key={key}
                type="button"
                className="cal-day"
                data-out={d.getMonth() !== month.getMonth()}
                data-today={key === now.toDateString()}
                aria-selected={selected === key}
                onClick={() => setSelected(key)}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>
      </Glass>
    </div>
  );
}

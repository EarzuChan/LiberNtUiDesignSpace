import { useState } from 'react';
import { useSys } from '@/lib/system';
import { Badge, Button, Expander, ProgressBar, Segmented, SettingRow, Slider, Switch } from '@/ui';
import {
  Alert20Regular, ArrowSync20Regular, Battery820Regular, BatterySaver20Regular, BrightnessHigh20Regular, Desktop20Regular, Speaker220Regular,
  SpeakerMute20Regular, Storage20Regular, Timer20Regular, TopSpeed20Regular, WeatherMoon20Regular, ZoomIn20Regular, Headphones20Regular,
} from '@/ui/icons';
import type { PageProps } from './Settings';
import { Group, Select } from './parts';

const STORAGE = [
  { name: '应用和功能', gb: 82, color: 'var(--blue-500)' },
  { name: '文档与媒体', gb: 41, color: 'var(--violet-500)' },
  { name: '系统', gb: 46, color: 'var(--teal-500)' },
  { name: '其他', gb: 17, color: 'var(--amber-500)' },
];

export function SystemPage({ go }: PageProps) {
  const s = useSys();
  const [scale, setScale] = useState('100%（推荐）');
  const [res, setRes] = useState('2560 × 1600（推荐）');
  const [out, setOut] = useState('Liber Buds Pro');
  const [power, setPower] = useState<'eco' | 'balanced' | 'perf'>('balanced');
  const [notify, setNotify] = useState(true);
  return (
    <>
      <div className="card set-hero">
        <div className="set-device">
          <img src="/icons/devices/laptop.svg" alt="" style={{ width: 56, height: 56 }} />
          <div>
            <div className="t-subtitle">{s.deviceName}</div>
            <div className="c-2">Liber Book Pro 16</div>
          </div>
        </div>
        <div className="set-hero-tiles">
          <button type="button" className="set-tile" onClick={() => go('update')}>
            <ArrowSync20Regular /><div><div className="t-body-strong">系统更新</div><div className="t-caption c-2">已是最新版本</div></div>
          </button>
          <button type="button" className="set-tile" onClick={() => go('about')}>
            <Storage20Regular /><div><div className="t-body-strong">存储</div><div className="t-caption c-2">已用 186 GB / 512 GB</div></div>
          </button>
        </div>
      </div>

      <Group title="显示">
        <SettingRow icon={<BrightnessHigh20Regular />} title="亮度" desc="调整内置显示器的亮度">
          <span className="c-2 tnum" style={{ width: 40, textAlign: 'right' }}>{s.brightness}%</span>
          <Slider value={s.brightness} min={10} onChange={v => s.set({ brightness: v })} style={{ flex: '0 0 220px' }} />
        </SettingRow>
        <SettingRow icon={<WeatherMoon20Regular />} title="夜间模式" desc="使用较暖的颜色帮助阻挡蓝光">
          <span className="c-2">{s.nightLight ? '开' : '关'}</span>
          <Switch checked={s.nightLight} onChange={v => s.set({ nightLight: v })} />
        </SettingRow>
        <SettingRow icon={<ZoomIn20Regular />} title="缩放" desc="更改文本、应用和其他项目的大小">
          <Select value={scale} onChange={setScale} options={['100%（推荐）', '125%', '150%', '175%']} />
        </SettingRow>
        <SettingRow icon={<Desktop20Regular />} title="显示器分辨率" desc="调整分辨率以适合所连接的显示器">
          <Select value={res} onChange={setRes} options={['2560 × 1600（推荐）', '1920 × 1200', '1680 × 1050']} width={190} />
        </SettingRow>
      </Group>

      <Group title="声音">
        <SettingRow icon={<Headphones20Regular />} title="输出设备" desc="选择播放声音的位置">
          <Select value={out} onChange={setOut} options={['Liber Buds Pro', '扬声器（内置）', 'Studio Display']} width={170} />
        </SettingRow>
        <SettingRow icon={s.muted ? <SpeakerMute20Regular /> : <Speaker220Regular />} title="音量">
          <span className="c-2 tnum" style={{ width: 40, textAlign: 'right' }}>{s.muted ? 0 : s.volume}</span>
          <Slider value={s.muted ? 0 : s.volume} onChange={v => s.set({ volume: v, muted: false })} style={{ flex: '0 0 220px' }} />
          <Button variant="subtle" onClick={() => s.set({ muted: !s.muted })}>{s.muted ? '取消静音' : '静音'}</Button>
        </SettingRow>
      </Group>

      <Group title="通知与专注">
        <SettingRow icon={<Alert20Regular />} title="通知" desc="获取来自应用和其他发送者的通知">
          <Switch checked={notify} onChange={setNotify} />
        </SettingRow>
        <SettingRow icon={<Timer20Regular />} title="专注模式" desc="开启后隐藏通知横幅并静音提示音">
          <Switch checked={s.focus} onChange={v => s.set({ focus: v })} />
        </SettingRow>
      </Group>

      <Group title="电源和电池">
        <SettingRow icon={<Battery820Regular />} title={<span className="row gap-8">电池电量 <Badge variant="success">86%</Badge></span>} desc="预计剩余使用时间 9 小时 12 分钟">
          <ProgressBar value={86} style={{ width: 220 }} />
        </SettingRow>
        <SettingRow icon={<TopSpeed20Regular />} title="电源模式" desc="根据电池续航与性能优化设备">
          <Segmented value={power} onChange={setPower} options={[{ value: 'eco', label: '节能' }, { value: 'balanced', label: '平衡' }, { value: 'perf', label: '高性能' }]} />
        </SettingRow>
        <SettingRow icon={<BatterySaver20Regular />} title="节电模式" desc="限制后台活动与部分视觉效果以延长续航">
          <Switch checked={s.batterySaver} onChange={v => s.set({ batterySaver: v })} />
        </SettingRow>
      </Group>

      <Group title="存储">
        <Expander icon={<Storage20Regular />} title="系统 (C:)" desc="已使用 186 GB，共 512 GB" defaultOpen trailing={<span className="c-2">326 GB 可用</span>}>
          <div style={{ padding: '14px 16px 16px 52px' }}>
            <div className="set-bars">
              {STORAGE.map(x => <i key={x.name} style={{ width: `${(x.gb / 512) * 100}%`, background: x.color }} />)}
              <i style={{ flex: 1, background: 'var(--fill-track)' }} />
            </div>
            <div className="set-legend">{STORAGE.map(x => <span key={x.name}><i style={{ background: x.color }} />{x.name} {x.gb} GB</span>)}</div>
          </div>
        </Expander>
      </Group>
    </>
  );
}

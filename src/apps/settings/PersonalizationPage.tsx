import { useRef, useState } from 'react';
import { ACCENTS, accentCss, findAccent } from '@/lib/accents';
import { addCustomWallpaper, customWallpapers, removeCustomWallpaper } from '@/lib/customWallpapers';
import { activeAccent, useSys, type Theme, type WallpaperFit } from '@/lib/system';
import { WALLPAPERS, resolveWallpaper, wallpaperFile, wallpaperThumb } from '@/lib/wallpapers';
import { Badge, Button, Dialog, Segmented, SettingRow, Switch } from '@/ui';
import { WallpaperLayer } from '@/ui/WallpaperLayer';
import {
  AlignLeft20Regular, Apps20Regular, Checkmark16Filled, Color20Regular, DarkTheme20Filled, DarkTheme20Regular, Desktop20Regular, Dismiss12Regular, Dock20Regular,
  Drop20Regular, Eyedropper20Regular, Oval20Regular, Image20Regular, ImageAdd20Regular, PaintBucket20Regular, Sparkle20Regular,
} from '@/ui/icons';
import { Group, Select } from './parts';

const DOCK = ['var(--accent)', '#34c0eb', '#f5a524', '#30b46c', '#8b6cf0'];
const FITS: { value: WallpaperFit; label: string }[] = [
  { value: 'fill', label: '填充' }, { value: 'fit', label: '适应' }, { value: 'stretch', label: '拉伸' }, { value: 'center', label: '居中' }, { value: 'tile', label: '平铺' },
];
const FIT_DESC: Record<WallpaperFit, string> = {
  fill: '等比放大铺满屏幕，超出部分裁掉', fit: '等比缩放完整显示，空边用模糊的图像垫底', stretch: '拉伸铺满屏幕，可能变形',
  center: '按原始尺寸居中，空边用模糊的图像垫底', tile: '按原始尺寸从左上角重复平铺',
};

/** 迷你桌面预览：壁纸 + 窗口 + Dock */
function Mini({ thumb, mode }: { thumb: string; mode: Theme }) {
  return (
    <div className="mini" data-mini={mode} style={{ backgroundImage: `url("${thumb}")` }}>
      <div className="mini-win"><i><b /><b /><b /><b /></i><i><b /><b /><b /><u /></i></div>
      <div className="mini-dock">{DOCK.map(c => <b key={c} style={{ background: c }} />)}</div>
    </div>
  );
}

interface Pending { file: File; url: string; w: number; h: number; fit: WallpaperFit }

export function PersonalizationPage() {
  const s = useSys();
  const wp = resolveWallpaper(s.wallpaper, s.theme);
  const accent = activeAccent(s);
  const picker = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const pick = Math.min(s.accentPick[s.wallpaperFile] ?? 0, Math.max(0, s.wallpaperPalette.length - 1));

  const choose = async (file?: File) => {
    if (!file) return;
    const bmp = await createImageBitmap(file);
    setPending({ file, url: URL.createObjectURL(file), w: bmp.width, h: bmp.height, fit: 'fill' });
    bmp.close();
  };
  const apply = async () => {
    if (!pending) return;
    const added = await addCustomWallpaper(pending.file, pending.file.name.replace(/\.[^.]+$/, ''));
    s.set({ wallpaper: added.id, wallpaperFit: pending.fit, wallpaperRev: s.wallpaperRev + 1 });
  };
  const closePending = () => {
    if (pending) URL.revokeObjectURL(pending.url);
    setPending(null);
    if (picker.current) picker.current.value = '';
  };
  const remove = async (id: string) => {
    await removeCustomWallpaper(id);
    s.set({ wallpaper: s.wallpaper === id ? 'waterfall' : s.wallpaper, wallpaperRev: s.wallpaperRev + 1 });
  };

  return (
    <>
      <div className="set-perso">
        <Mini thumb={wp.thumb} mode={s.theme} />
        <div>
          <h3 className="group-title" style={{ marginTop: 0 }}>主题模式</h3>
          <div className="theme-cards" role="radiogroup">
            {(['light', 'dark'] as const).map(t => (
              <button key={t} type="button" role="radio" className="theme-card" aria-checked={s.theme === t} onClick={() => s.set({ theme: t })}>
                <Mini thumb={resolveWallpaper(s.wallpaper, t).thumb} mode={t} />
                <span>{t === 'light' ? '亮色' : '暗色'}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Group title="颜色">
        <SettingRow icon={<Color20Regular />} title="强调色" desc={s.accentMode === 'wallpaper' ? '从当前壁纸提取，换壁纸或切换亮/暗时自动更新' : `使用预设颜色 · ${findAccent(s.accent).name}`}>
          <Segmented value={s.accentMode} onChange={v => s.set({ accentMode: v })} options={[{ value: 'wallpaper', label: '跟随壁纸' }, { value: 'preset', label: '自选颜色' }]} />
        </SettingRow>
        <SettingRow icon={<Eyedropper20Regular />} title={s.accentMode === 'wallpaper' ? '壁纸中的颜色' : '预设颜色'} desc={s.accentMode === 'wallpaper' ? '按面积与鲜艳程度排序，可改选其他候选色' : undefined}>
          <div className="swatches" role="radiogroup">
            {s.accentMode === 'wallpaper'
              ? s.wallpaperPalette.map((a, i) => (
                  <button key={i} type="button" role="radio" className="swatch" aria-checked={i === pick} style={{ background: accentCss(a) }} onClick={() => s.set({ accentPick: { ...s.accentPick, [s.wallpaperFile]: i } })}>
                    {i === pick && <Checkmark16Filled style={{ color: 'var(--on-accent)' }} />}
                  </button>
                ))
              : ACCENTS.map(a => (
                  <button key={a.id} type="button" role="radio" className="swatch" aria-checked={a.id === s.accent} data-tip={a.name} style={{ background: accentCss(a) }} onClick={() => s.set({ accent: a.id })}>
                    {a.id === s.accent && <Checkmark16Filled style={{ color: 'var(--on-accent)' }} />}
                  </button>
                ))}
          </div>
        </SettingRow>
        <SettingRow icon={<PaintBucket20Regular />} title="表面着色" desc="让窗口底板、内容面板和卡片带上一点强调色的色调">
          <Segmented value={String(s.tintLevel)} onChange={v => s.set({ tintLevel: Number(v) as 0 | 1 | 2 })} options={[{ value: '0', label: '关' }, { value: '1', label: '柔和' }, { value: '2', label: '鲜明' }]} />
        </SettingRow>
      </Group>

      <Group title="背景">
        <SettingRow icon={<Image20Regular />} title={<span className="row gap-8">{wp.name}{wp.dynamic && <Badge variant="tint">动态</Badge>}</span>} desc={wp.dynamic ? `随亮/暗模式自动切换 · ${wp.credit}` : wp.credit}>
          <Select value={FITS.find(f => f.value === s.wallpaperFit)!.label} options={FITS.map(f => f.label)} onChange={l => s.set({ wallpaperFit: FITS.find(f => f.label === l)!.value })} width={104} />
          <Button pill icon={<ImageAdd20Regular style={{ width: 16, height: 16 }} />} onClick={() => picker.current?.click()}>浏览照片</Button>
          <input ref={picker} type="file" accept="image/*" hidden onChange={e => choose(e.target.files?.[0])} />
        </SettingRow>
        <div className="wp-grid" role="radiogroup">
          {customWallpapers().map(w => (
            <div key={w.id} className="wp-item" role="radio" aria-checked={w.id === s.wallpaper} tabIndex={0} onClick={() => s.set({ wallpaper: w.id })}>
              <img src={w.thumb} alt={w.name} />
              <span>{w.name}</span>
              <button type="button" className="wp-remove" data-tip="移除" onClick={e => { e.stopPropagation(); remove(w.id); }}><Dismiss12Regular /></button>
            </div>
          ))}
          {WALLPAPERS.map(w => (
            <button key={w.id} type="button" role="radio" className="wp-item" aria-checked={w.id === s.wallpaper} onClick={() => s.set({ wallpaper: w.id })}>
              <img src={wallpaperThumb(wallpaperFile(w, s.theme))} alt={w.name} loading="lazy" />
              <span>{w.name}</span>
              {w.dark && <i data-tip="动态壁纸"><DarkTheme20Filled style={{ width: 12, height: 12 }} /></i>}
            </button>
          ))}
        </div>
        <SettingRow icon={<DarkTheme20Regular />} title="暗色模式下压暗壁纸" desc={s.theme === 'dark' ? (s.wallpaperDim > 0.005 ? `当前壁纸偏亮，已压暗 ${Math.round(s.wallpaperDim * 100)}%` : '当前壁纸足够暗，无需压暗') : '壁纸越亮压得越多；切换到暗色模式后生效'}>
          {s.dimWallpaper && <Segmented value={s.dimTinted ? 'tint' : 'neutral'} onChange={v => s.set({ dimTinted: v === 'tint' })} options={[{ value: 'neutral', label: '中性' }, { value: 'tint', label: '带色调' }]} />}
          <Switch checked={s.dimWallpaper} onChange={v => s.set({ dimWallpaper: v })} />
        </SettingRow>
      </Group>

      <Group title="视觉效果">
        <SettingRow icon={<Drop20Regular />} title="透明效果" desc="窗口和外壳表面呈现半透明的自适应玻璃材质">
          <Switch checked={s.transparency} onChange={v => s.set({ transparency: v })} />
        </SettingRow>
        <SettingRow icon={<Sparkle20Regular />} title="动画效果" desc="窗口、菜单和控件的过渡动画">
          <Switch checked={s.animations} onChange={v => s.set({ animations: v })} />
        </SettingRow>
      </Group>

      <Group title="任务栏与桌面">
        <SettingRow icon={<Dock20Regular />} title="任务栏样式" desc={s.taskbarStyle === 'dock' ? '悬浮 Dock：Dock 与托盘悬浮在桌面上，窗口最大化时收拢为通栏' : '经典任务栏：贴底通栏，开始按钮、应用图标与托盘同在一条栏上'}>
          <Segmented value={s.taskbarStyle} onChange={v => s.set({ taskbarStyle: v })} options={[{ value: 'dock', label: '悬浮 Dock' }, { value: 'classic', label: '经典任务栏' }]} />
        </SettingRow>
        {s.taskbarStyle === 'dock' && (
          <SettingRow icon={<Oval20Regular />} title="Dock 外形" desc="胶囊：Dock 与托盘为全圆；圆角矩形：棱角更分明">
            <Segmented value={s.dockShape} onChange={v => s.set({ dockShape: v })} options={[{ value: 'pill', label: '胶囊' }, { value: 'rounded', label: '圆角矩形' }]} />
          </SettingRow>
        )}
        <SettingRow icon={<AlignLeft20Regular />} title="任务栏对齐方式" desc="开始按钮与应用图标在屏幕底部的位置">
          <Segmented value={s.dockAlign} onChange={v => s.set({ dockAlign: v })} options={[{ value: 'left', label: '靠左' }, { value: 'center', label: '居中' }]} />
        </SettingRow>
        <SettingRow icon={<Apps20Regular />} title="桌面小组件" desc="在桌面右上角显示日期、天气和系统状态">
          <Switch checked={s.showWidgets} onChange={v => s.set({ showWidgets: v })} />
        </SettingRow>
        <SettingRow icon={<Desktop20Regular />} title="桌面图标" desc="在桌面上显示文件和快捷方式">
          <Switch checked={s.showDesktopIcons} onChange={v => s.set({ showDesktopIcons: v })} />
        </SettingRow>
      </Group>

      <Dialog open={!!pending} title="设置为桌面壁纸" width={520} onClose={closePending} actions={[{ label: '应用', variant: 'accent', onClick: apply }, { label: '取消' }]}>
        {pending && (
          <>
            <div className="wp-preview">
              <WallpaperLayer url={pending.url} fit={pending.fit} natural={pending} scale={472 / window.innerWidth} />
              <div className="mini-dock">{DOCK.map(c => <b key={c} style={{ background: c === 'var(--accent)' ? accentCss(accent) : c }} />)}</div>
            </div>
            <div className="row" style={{ justifyContent: 'space-between', marginTop: 16 }}>
              <span className="t-body-strong">契合度</span>
              <Segmented value={pending.fit} onChange={fit => setPending({ ...pending, fit })} options={FITS} />
            </div>
            <p className="t-caption" style={{ marginTop: 8 }}>{FIT_DESC[pending.fit]} · 原图 {pending.w} × {pending.h}</p>
          </>
        )}
      </Dialog>
    </>
  );
}

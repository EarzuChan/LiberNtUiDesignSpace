import { useId, useLayoutEffect, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type InputHTMLAttributes, type ReactNode, type Ref } from 'react';
import { getLang } from '@/i18n';
import { ChevronDown16Regular, Dismiss12Regular } from './icons';

const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ');
export { cx };

/* ---------- Button ---------- */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'standard' | 'accent' | 'subtle' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  iconOnly?: boolean;
  /** 胶囊外形：独立主操作、媒体控制、筛选标签 */
  pill?: boolean;
  pressed?: boolean;
  tip?: string;
  ref?: Ref<HTMLButtonElement>;
}
export function Button({ variant = 'standard', size = 'md', icon, iconOnly, pill, pressed, tip, className, children, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={cx('btn', variant !== 'standard' && `btn-${variant}`, size !== 'md' && `btn-${size}`, (iconOnly || (!!icon && !children)) && 'btn-icon', pill && 'btn-pill', className)}
      aria-pressed={pressed}
      data-tip={tip}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

/* ---------- Switch ---------- */
export function Switch({ checked, onChange, disabled, label, className }: { checked: boolean; onChange?: (v: boolean) => void; disabled?: boolean; label?: ReactNode; className?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-disabled={disabled} className={cx('switch', className)} onClick={() => onChange?.(!checked)}>
      {label && <span>{label}</span>}
      <span className="switch-track"><span className="switch-knob" /></span>
    </button>
  );
}

/* ---------- Checkbox / Radio ---------- */
/** 圆形复选框：勾从圆内划出圈外，圈外部分反色（圈内为强调色上的文字色，圈外为强调色） */
export function Checkbox({ checked, onChange, disabled, children }: { checked: boolean | 'mixed'; onChange?: (v: boolean) => void; disabled?: boolean; children?: ReactNode }) {
  const id = useId();
  const d = checked === 'mixed' ? 'M7.6 12h8.8' : 'M7.2 12.4l3.4 3.5L22.3 2.4';
  return (
    <button type="button" role="checkbox" aria-checked={checked} aria-disabled={disabled} className="check" onClick={() => onChange?.(checked !== true)}>
      <span className="check-box">
        <svg viewBox="0 0 24 24" aria-hidden>
          <clipPath id={id}><circle cx="12" cy="12" r="9" /></clipPath>
          <circle className="check-ring" cx="12" cy="12" r="8.5" />
          <path className="check-mark check-mark-out" d={d} />
          <path className="check-mark check-mark-in" d={d} clipPath={`url(#${id})`} />
        </svg>
      </span>
      {children && <span>{children}</span>}
    </button>
  );
}
export function Radio({ checked, onChange, disabled, children }: { checked: boolean; onChange?: () => void; disabled?: boolean; children?: ReactNode }) {
  return (
    <button type="button" role="radio" aria-checked={checked} aria-disabled={disabled} className="check" onClick={() => onChange?.()}>
      <span className="radio-dot" />
      {children && <span>{children}</span>}
    </button>
  );
}

/* ---------- Slider ---------- */
export function Slider({ value, onChange, min = 0, max = 100, fat, icon, className, style }: { value: number; onChange?: (v: number) => void; min?: number; max?: number; fat?: boolean; icon?: ReactNode; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const pn = (value - min) / (max - min);
  const update = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    const pad = fat ? 16 : 10;
    const t = Math.min(1, Math.max(0, (clientX - r.left - pad) / (r.width - pad * 2)));
    onChange?.(Math.round(min + t * (max - min)));
  };
  return (
    <div
      ref={ref}
      role="slider"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      data-dragging={dragging}
      className={cx('slider', fat && 'slider-fat', className)}
      style={{ ...style, '--p': `${pn * 100}%`, '--pn': pn } as CSSProperties}
      onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); setDragging(true); update(e.clientX); }}
      onPointerMove={e => dragging && update(e.clientX)}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      onKeyDown={e => {
        const step = (max - min) / 20;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange?.(Math.max(min, value - step));
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange?.(Math.min(max, value + step));
      }}
    >
      <div className="slider-track"><div className="slider-fill" /></div>
      {icon && <span className="slider-icon">{icon}</span>}
      <div className="slider-thumb" />
    </div>
  );
}

/* ---------- TextField ---------- */
export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size' | 'prefix'> {
  value: string;
  onChange?: (v: string) => void;
  prefix?: ReactNode;
  suffix?: ReactNode;
  pill?: boolean;
  large?: boolean;
  clearable?: boolean;
  fieldClassName?: string;
  fieldStyle?: CSSProperties;
  inputRef?: Ref<HTMLInputElement>;
}
export function TextField({ value, onChange, prefix, suffix, pill, large, clearable, fieldClassName, fieldStyle, inputRef, ...rest }: TextFieldProps) {
  return (
    <label className={cx('field', pill && 'field-pill', large && 'field-lg', fieldClassName)} style={fieldStyle}>
      {prefix}
      <input ref={inputRef} value={value} onChange={e => onChange?.(e.target.value)} spellCheck={false} {...rest} />
      {clearable && value && (
        <button type="button" className="field-clear" onClick={() => onChange?.('')} tabIndex={-1}><Dismiss12Regular /></button>
      )}
      {suffix}
    </label>
  );
}

/* ---------- Segmented ---------- */
export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange?: (v: T) => void; options: { value: T; label: ReactNode; icon?: ReactNode }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (el) setThumb({ left: el.offsetLeft, width: el.offsetWidth });
    // 语言切换后选项宽度会变，需要重新测量
  }, [value, options.length, getLang()]);
  return (
    <div className="seg" role="tablist" ref={ref}>
      {thumb && <span className="seg-thumb" style={thumb} />}
      {options.map(o => (
        <button key={o.value} type="button" role="tab" className="seg-item" aria-selected={o.value === value} onClick={() => onChange?.(o.value)}>
          {o.icon}{o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Tabs ---------- */
export function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange?: (v: T) => void; options: { value: T; label: ReactNode }[] }) {
  return (
    <div className="tabs" role="tablist">
      {options.map(o => (
        <button key={o.value} type="button" role="tab" className="tab" aria-selected={o.value === value} onClick={() => onChange?.(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

/* ---------- Progress ---------- */
export function ProgressBar({ value, style }: { value?: number; style?: CSSProperties }) {
  return <div className="progress" data-indeterminate={value === undefined} style={style}><i style={value === undefined ? undefined : { width: `${value}%` }} /></div>;
}
export function ProgressRing({ size = 24 }: { size?: number }) {
  return <svg className="ring" width={size} height={size} viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" strokeWidth="5" /></svg>;
}

export function Badge({ variant, dot, children }: { variant?: 'accent' | 'tint' | 'success' | 'caution' | 'critical'; dot?: boolean; children?: ReactNode }) {
  return <span className={cx('badge', variant && `badge-${variant}`, dot && 'badge-dot')}>{children}</span>;
}

export function Avatar({ size = 32, src = '/emoji/fox.png' }: { size?: number; src?: string }) {
  return <span className="avatar" style={{ width: size, height: size, display: 'inline-block' }}><img src={src} alt="" /></span>;
}

export function SelectButton({ children, ...rest }: ButtonProps) {
  return <Button className="select" {...rest}>{children}<ChevronDown16Regular /></Button>;
}

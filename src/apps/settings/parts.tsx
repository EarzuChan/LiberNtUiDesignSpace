import type { ReactNode } from 'react';
import { SelectButton, openMenuAt } from '@/ui';

export function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <>
      {title && <h3 className="group-title">{title}</h3>}
      <section className="group">{children}</section>
    </>
  );
}

/** 下拉选择：按钮 + 菜单 */
export function Select<T extends string>({ value, options, onChange, width }: { value: T; options: readonly T[]; onChange: (v: T) => void; width?: number }) {
  return (
    <SelectButton style={{ minWidth: width ?? 140, flex: 'none' }} onClick={e => openMenuAt(e.currentTarget, options.map(o => ({ label: o, checked: o === value, onClick: () => onChange(o) })), { minWidth: e.currentTarget.offsetWidth })}>
      {value}
    </SelectButton>
  );
}

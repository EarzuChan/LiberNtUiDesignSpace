import { useId } from 'react';

/** LiberNT 标志：两个相扣的直角。渐变随主题变化（--logo-from / --logo-to）：亮色下深蓝，暗色下浅蓝 */
export function Logo({ size = 24, mono }: { size?: number; mono?: boolean }) {
  const id = useId();
  const fill = mono ? 'currentColor' : `url(#${id})`;
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden style={{ flex: 'none', display: 'block' }}>
      <path d="M0 5.83331H5.83333V20.4166H20.4167V26.25H0V5.83331Z" fill={fill} />
      <path d="M28 1.75H7.58331V7.58333H22.1666V22.1667H28V1.75Z" fill={fill} />
      {!mono && (
        <defs>
          <linearGradient id={id} x1="0" y1="1.75" x2="28" y2="26.25" gradientUnits="userSpaceOnUse">
            <stop style={{ stopColor: 'var(--logo-from)' }} />
            <stop offset="1" style={{ stopColor: 'var(--logo-to)' }} />
          </linearGradient>
        </defs>
      )}
    </svg>
  );
}

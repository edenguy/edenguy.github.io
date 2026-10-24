import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'o2' | 'n2' | 'danger' | 'warn' | 'safe';
  className?: string;
}) {
  const tones = {
    neutral: 'bg-surface-3 text-ink-2',
    accent: 'bg-accent-soft text-accent',
    o2: 'bg-o2-soft text-o2',
    n2: 'bg-n2-soft text-n2',
    danger: 'bg-danger-soft text-danger',
    warn: 'bg-warn-soft text-warn',
    safe: 'bg-safe-soft text-safe',
  };
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', tones[tone], className)}>
      {children}
    </span>
  );
}

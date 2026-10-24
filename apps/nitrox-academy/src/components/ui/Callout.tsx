import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export type CalloutVariant = 'info' | 'science' | 'insight' | 'warning' | 'safety' | 'standard';

const styles: Record<CalloutVariant, { border: string; icon: IconName; iconColor: string; bg: string }> = {
  info: { border: 'border-n2/40', icon: 'info', iconColor: 'text-n2', bg: 'bg-n2-soft' },
  science: { border: 'border-accent/40', icon: 'atom', iconColor: 'text-accent', bg: 'bg-accent-soft' },
  insight: { border: 'border-warn/40', icon: 'lightbulb', iconColor: 'text-warn', bg: 'bg-warn-soft' },
  warning: { border: 'border-warn/50', icon: 'alert', iconColor: 'text-warn', bg: 'bg-warn-soft' },
  safety: { border: 'border-danger/50', icon: 'shield', iconColor: 'text-danger', bg: 'bg-danger-soft' },
  standard: { border: 'border-line-strong', icon: 'book', iconColor: 'text-ink-2', bg: 'bg-surface-2' },
};

export function Callout({
  variant = 'info',
  title,
  children,
  className,
}: {
  variant?: CalloutVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const s = styles[variant];
  return (
    <div className={clsx('rounded-2xl border p-4 md:p-5 flex gap-3', s.border, s.bg, className)}>
      <div className={clsx('shrink-0 mt-0.5', s.iconColor)}>
        <Icon name={s.icon} size={22} />
      </div>
      <div className="min-w-0 flex-1">
        {title && <div className="font-semibold text-ink mb-1">{title}</div>}
        <div className="text-ink-2 text-[15px] leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

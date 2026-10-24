import { clsx } from 'clsx';

/** Instrument-style numeric readout: label, big number, unit. */
export function Readout({
  label,
  value,
  unit,
  tone = 'default',
  size = 'md',
  className,
  sub,
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: 'default' | 'o2' | 'n2' | 'accent' | 'danger' | 'warn' | 'safe';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  sub?: string;
}) {
  const colors: Record<typeof tone, string> = {
    default: 'text-ink',
    o2: 'text-o2',
    n2: 'text-n2',
    accent: 'text-accent',
    danger: 'text-danger',
    warn: 'text-warn',
    safe: 'text-safe',
  };
  const sizes = { sm: 'text-xl', md: 'text-2xl sm:text-3xl', lg: 'text-3xl sm:text-4xl md:text-5xl' };
  return (
    <div className={clsx('rounded-2xl bg-surface-2 border border-line px-4 py-3 min-w-0', className)}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted leading-tight">{label}</div>
      <div className={clsx('readout font-semibold leading-tight mt-0.5 flex items-baseline gap-1.5', colors[tone], sizes[size])}>
        <span>{value}</span>
        {unit && <span className="text-sm font-medium text-muted">{unit}</span>}
      </div>
      {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
    </div>
  );
}

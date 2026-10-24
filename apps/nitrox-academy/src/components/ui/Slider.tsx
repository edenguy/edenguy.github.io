import { clsx } from 'clsx';
import { useId } from 'react';

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
  color,
  className,
  ticks,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  /** CSS color for thumb and filled track. */
  color?: string;
  className?: string;
  ticks?: { value: number; label: string }[];
}) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  const fill = color ?? 'var(--accent)';
  return (
    <div className={clsx('w-full', className)}>
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <label htmlFor={id} className="text-sm font-medium text-ink-2 min-w-0 truncate">
          {label}
        </label>
        <span className="readout text-sm sm:text-base font-semibold text-ink shrink-0">{format ? format(value) : value}</span>
      </div>
      {/* The slider itself is always LTR so that "more" is to the right in both languages, matching the gauges. */}
      <div dir="ltr">
        <input
          id={id}
          type="range"
          className="slider"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={
            {
              '--thumb': fill,
              '--track': `linear-gradient(90deg, ${fill} 0%, ${fill} ${pct}%, var(--surface-3) ${pct}%, var(--surface-3) 100%)`,
            } as React.CSSProperties
          }
          aria-valuetext={format ? format(value) : String(value)}
        />
        {ticks && (
          <div className="relative h-4 text-[11px] text-muted">
            {ticks.map((t) => (
              <span
                key={t.value}
                className="absolute -translate-x-1/2 whitespace-nowrap"
                style={{ left: `${((t.value - min) / (max - min)) * 100}%` }}
              >
                {t.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

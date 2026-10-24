import { clsx } from 'clsx';
import { rovingRadioKeyDown } from './useRovingRadio';

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  size = 'md',
  className,
  ariaLabel,
  dir,
}: {
  options: { value: T; label: string; hint?: string }[];
  value: T;
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
  className?: string;
  ariaLabel?: string;
  /** Numeric scales (PPO2 limits, mixes) read left-to-right next to LTR sliders even in Hebrew. */
  dir?: 'ltr' | 'rtl';
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      dir={dir}
      onKeyDown={rovingRadioKeyDown(
        options.length,
        Math.max(0, options.findIndex((o) => o.value === value)),
        (i) => onChange(options[i]!.value),
      )}
      className={clsx('inline-flex flex-wrap p-1 rounded-full bg-surface-2 border border-line gap-1 max-w-full', className)}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            title={o.hint}
            onClick={() => onChange(o.value)}
            className={clsx(
              'rounded-full font-medium transition-colors whitespace-nowrap',
              size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm',
              active ? 'bg-accent text-accent-ink shadow' : 'text-ink-2 hover:text-ink hover:bg-surface-3',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

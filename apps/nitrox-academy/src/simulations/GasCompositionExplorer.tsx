import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MoleculeField } from './MoleculeField';
import { Slider } from '@/components/ui/Slider';
import { Readout } from '@/components/ui/Readout';
import { mixName } from '@/science';
import { clsx } from 'clsx';

export interface GasCompositionProps {
  min?: number;
  max?: number;
  initial?: number;
  presets?: number[];
  compact?: boolean;
}

export function GasCompositionExplorer({ min = 21, max = 40, initial = 32, presets = [21, 32, 36, 40], compact }: GasCompositionProps) {
  const { t } = useTranslation();
  const [pct, setPct] = useState(initial);
  const fo2 = pct / 100;
  const name = mixName(fo2);

  return (
    <div className="grid gap-5 md:grid-cols-[auto_1fr] md:items-center">
      <div className="flex justify-center">
        <MoleculeField fo2={fo2} size={compact ? 200 : 250} />
      </div>
      <div className="min-w-0 space-y-4">
        <div dir="ltr" className="flex flex-wrap items-center gap-2 rtl:justify-end">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPct(p)}
              className={clsx(
                'rounded-full px-3 py-1 text-sm font-semibold border transition-colors readout',
                pct === p ? 'bg-o2 text-white border-o2' : 'bg-surface-2 border-line text-ink-2 hover:text-ink',
              )}
            >
              {p === 21 ? t('sim.air') : mixName(p / 100)}
            </button>
          ))}
        </div>
        <Slider label={t('sim.fo2')} value={pct} min={min} max={max} onChange={setPct} format={(v) => `${v}%`} color="var(--o2)" />
        {/* stacked bar */}
        <div dir="ltr" className="h-5 w-full rounded-full overflow-hidden flex bg-surface-3 border border-line">
          <div className="h-full bg-o2 transition-[width] duration-300" style={{ width: `${pct}%` }} />
          <div className="h-full bg-n2 transition-[width] duration-300" style={{ width: `${100 - pct}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Readout label={t('common.oxygen')} value={`${pct}`} unit="%" tone="o2" sub={`FO2 = ${fo2.toFixed(2)}`} />
          <Readout label={t('common.nitrogen')} value={`${100 - pct}`} unit="%" tone="n2" sub={`FN2 = ${(1 - fo2).toFixed(2)}`} />
        </div>
        <p className="text-sm text-ink-2">
          <span className="sci">{name === 'Air' ? t('sim.air') : name}</span> · {t('sim.molecules', { o2: pct, n2: 100 - pct })}
        </p>
      </div>
    </div>
  );
}

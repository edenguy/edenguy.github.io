import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WaterColumn } from './WaterColumn';
import { Slider } from '@/components/ui/Slider';
import { Readout } from '@/components/ui/Readout';
import { absolutePressure, gaugePressure } from '@/science';
import { useIsNarrow } from '@/app/useMediaQuery';
import { maxDepthFor, useUnits } from './shared';

/**
 * Pressure versus depth: absolute and gauge pressure, plus a flexible air space
 * (a balloon) whose volume shrinks as 1/P to make "pressure" tangible.
 */
export function PressureColumn({ initialDepth = 0 }: { initialDepth?: number }) {
  const { t } = useTranslation();
  const { units, unitLabel, perAtm, fmtDepth } = useUnits();
  const narrow = useIsNarrow();
  const maxDepth = maxDepthFor(units, false);
  const [depth, setDepth] = useState(initialDepth);
  const pAbs = absolutePressure(depth, units);
  const pGauge = gaugePressure(depth, units);
  const volume = 1 / pAbs;
  const atmBlocks = Math.floor(pAbs + 1e-9);

  return (
    <div className="grid gap-5 grid-cols-[auto_1fr] items-start">
      <WaterColumn
        depth={depth}
        maxDepth={maxDepth}
        units={units}
        onChange={setDepth}
        surfaceLabel={t('common.surface')}
        unitLabel={unitLabel}
        width={narrow ? 104 : 150}
        height={narrow ? 280 : 320}
      />
      <div className="min-w-0 space-y-4">
        <Slider label={t('common.depth')} value={depth} min={0} max={maxDepth} onChange={setDepth} format={(v) => fmtDepth(v)} />
        <div className="grid grid-cols-2 gap-3">
          <Readout label={t('sim.absPressure')} value={pAbs.toFixed(2)} unit={t('common.ata')} tone="accent" />
          <Readout label={t('sim.gaugePressure')} value={pGauge.toFixed(2)} unit={t('common.bar')} />
        </div>
        {/* pressure stack: 1 block per atmosphere */}
        <div className="flex items-end gap-4">
          <div dir="ltr" className="flex flex-col-reverse gap-1" aria-hidden>
            {Array.from({ length: Math.max(1, Math.ceil(pAbs - 1e-9)) }).map((_, i) => {
              const full = i < atmBlocks;
              const frac = full ? 1 : pAbs - atmBlocks;
              return (
                <div key={i} className="w-20 h-6 rounded-md border border-line overflow-hidden bg-surface-3 relative">
                  <div className={i === 0 ? 'bg-accent h-full' : 'bg-n2 h-full'} style={{ width: `${frac * 100}%`, transition: 'width 200ms' }} />
                  <span className="absolute inset-0 grid place-items-center text-[10px] font-semibold readout text-ink">
                    {i === 0 ? t('sim.atm') : `+${perAtm} ${unitLabel}`}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex-1 grid place-items-center">
            <svg width={120} height={120} viewBox="0 0 120 120" role="img" aria-label={`${Math.round(volume * 100)}%`}>
              <circle cx={60} cy={60} r={52} fill="none" stroke="var(--line)" strokeDasharray="3 4" />
              <circle cx={60} cy={60} r={Math.max(8, 52 * Math.cbrt(volume))} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={2.5} style={{ transition: 'r 200ms ease-out' }} />
              <text x={60} y={64} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--ink)" fontFamily="var(--font-mono)">
                {Math.round(volume * 100)}%
              </text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

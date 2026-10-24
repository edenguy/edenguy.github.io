import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { Slider } from '@/components/ui/Slider';
import { Segmented } from '@/components/ui/Segmented';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { mixName, modSteps } from '@/science';
import { useProgress } from '@/progress/store';
import { useUnits } from './shared';

export interface ModCalculatorProps {
  initialFo2?: number;
  limits?: number[];
  minPct?: number;
  maxPct?: number;
}

export function ModCalculator({ initialFo2 = 0.32, limits = [1.4, 1.6], minPct = 21, maxPct = 40 }: ModCalculatorProps) {
  const { t } = useTranslation();
  const { units, unitLabel, perAtm } = useUnits();
  const unlock = useProgress((s) => s.unlock);
  const [pct, setPct] = useState(Math.round(initialFo2 * 100));
  // Default to the commonly taught 1.4 ata working limit when it is on offer.
  const [limit, setLimit] = useState(limits.includes(1.4) ? 1.4 : (limits[0] ?? 1.4));
  const [shown, setShown] = useState(0);
  const s = modSteps(pct / 100, limit, units);

  useEffect(() => {
    if (shown >= 4) unlock('mod-calc');
  }, [shown, unlock]);

  const steps = [
    { text: t('sim.step1'), math: `${limit.toFixed(1)} ÷ ${s.fo2.toFixed(2)} = ${s.pAbsAtLimit.toFixed(2)} ata` },
    { text: t('sim.step2'), math: `${s.pAbsAtLimit.toFixed(2)} − 1 = ${s.gaugeAtLimit.toFixed(2)} ata` },
    { text: t('sim.step3', { perAtm, unit: unitLabel }), math: `${s.gaugeAtLimit.toFixed(2)} × ${perAtm} = ${s.exactDepth.toFixed(1)} ${unitLabel}` },
    { text: t('sim.step4', { unit: unitLabel }), math: `MOD = ${s.mod} ${unitLabel}` },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 md:items-end">
        <Slider label={t('sim.fo2')} value={pct} min={minPct} max={maxPct} onChange={(v) => { setPct(v); }} format={(v) => (v === 21 ? t('sim.air') : mixName(v / 100))} color="var(--o2)" />
        <div>
          <div className="text-sm font-medium text-ink-2 mb-1">{t('lab.ppo2Limit')}</div>
          <Segmented dir="ltr" ariaLabel={t('lab.ppo2Limit')} options={limits.map((l) => ({ value: l, label: `${l.toFixed(1)} ata` }))} value={limit} onChange={setLimit} />
        </div>
      </div>

      <div dir="ltr" className="readout text-center text-lg md:text-xl font-medium text-ink py-3 px-4 rounded-xl bg-surface-3 border border-line">
        MOD = (PPO2<sub>limit</sub> ÷ FO2 − 1) × {perAtm}
      </div>

      <ol className="space-y-3">
        {steps.map((st, i) => {
          const visible = i < shown;
          return (
            <li
              key={i}
              className={clsx(
                'rounded-2xl border p-4 transition-all duration-300',
                visible ? 'border-line bg-surface-2 opacity-100 translate-y-0' : 'border-dashed border-line opacity-40',
              )}
            >
              <div className="flex items-start gap-3">
                <span className={clsx('shrink-0 grid place-items-center w-7 h-7 rounded-full text-xs font-bold', visible ? 'bg-accent text-accent-ink' : 'bg-surface-3 text-muted')}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] text-ink-2">{st.text}</p>
                  {visible && (
                    <div dir="ltr" className="readout mt-2 text-base md:text-lg font-semibold text-ink">
                      {st.math}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-3">
        {shown < steps.length ? (
          <Button onClick={() => setShown((n) => n + 1)}>
            {shown === 0 ? t('common.showSteps') : t('common.next')} <Icon name="arrow" size={18} className="rtl:-scale-x-100" />
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => setShown(0)}>
            <Icon name="refresh" size={18} /> {t('common.tryAgain')}
          </Button>
        )}
        <div className={clsx('ms-auto rounded-2xl px-4 py-2 border transition-opacity', shown >= steps.length ? 'opacity-100 border-warn/50 bg-warn-soft' : 'opacity-50 border-line bg-surface-2')}>
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted font-semibold">{t('sim.modAt', { limit: limit.toFixed(1) })}</div>
          <div className="readout text-2xl font-bold text-ink">
            {shown >= steps.length ? s.mod : '—'} <span className="text-sm text-muted font-medium">{unitLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

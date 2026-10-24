import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WaterColumn } from './WaterColumn';
import { Ppo2DepthChart } from './Ppo2DepthChart';
import { Slider } from '@/components/ui/Slider';
import { Readout } from '@/components/ui/Readout';
import { Segmented } from '@/components/ui/Segmented';
import { Badge } from '@/components/ui/Badge';
import { bestMix, mixName, mod, ppo2AtDepth } from '@/science';
import { useIsNarrow } from '@/app/useMediaQuery';
import { maxDepthFor, ppo2Status, statusTone, usePlanningLimit, useUnits } from './shared';

export interface ModExplorerProps {
  minPct?: number;
  maxPct?: number;
  initialPct?: number;
  limits?: number[];
  deep?: boolean;
}

export function ModExplorer({ minPct = 21, maxPct = 40, initialPct = 32, limits = [1.4, 1.6], deep = true }: ModExplorerProps) {
  const { t } = useTranslation();
  const { units, unitLabel, fmtDepth } = useUnits();
  const [limit, setLimit] = usePlanningLimit();
  const narrow = useIsNarrow();
  const maxDepth = maxDepthFor(units, deep);
  const [pct, setPct] = useState(initialPct);
  const [depth, setDepth] = useState(units === 'm' ? 30 : 100);
  const fo2 = pct / 100;
  const effectiveLimit = limits.includes(limit) ? limit : (limits[0] ?? 1.4);
  const modExact = mod(fo2, effectiveLimit, { unit: units, rounding: 'exact' });
  const modFloor = mod(fo2, effectiveLimit, { unit: units });
  const mod16 = mod(fo2, 1.6, { unit: units });
  const ppo2 = ppo2AtDepth(fo2, depth, units);
  const status = ppo2Status(ppo2, effectiveLimit);
  // Best mix is reported only up to this explorer's own ceiling: a lesson capped at 40% must
  // never appear to recommend EAN70 for a 10 m dive. Richer answers are flagged instead.
  const bestRaw = bestMix(depth, effectiveLimit, units);
  const bestCapped = Math.min(bestRaw, maxPct / 100);
  const bestIsCapped = bestRaw > maxPct / 100 + 1e-9;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 md:items-end">
        <Slider label={t('sim.fo2')} value={pct} min={minPct} max={maxPct} onChange={setPct} format={(v) => (v === 21 ? t('sim.air') : mixName(v / 100))} color="var(--o2)" />
        <div>
          <div className="text-sm font-medium text-ink-2 mb-1">{t('lab.ppo2Limit')}</div>
          <Segmented dir="ltr" ariaLabel={t('lab.ppo2Limit')} options={limits.map((l) => ({ value: l, label: `${l.toFixed(1)} ata` }))} value={effectiveLimit} onChange={setLimit} />
        </div>
      </div>
      <div className="grid gap-5 grid-cols-[auto_1fr] items-start">
        <WaterColumn
          depth={depth}
          maxDepth={maxDepth}
          units={units}
          onChange={setDepth}
          height={narrow ? 320 : 380}
          bands={[
            { from: 0, to: Math.min(modFloor, maxDepth), color: 'rgba(61,220,151,0.10)' },
            { from: Math.min(modFloor, maxDepth), to: Math.min(mod16, maxDepth), color: 'rgba(245,184,61,0.2)' },
            { from: Math.min(mod16, maxDepth), to: maxDepth, color: 'rgba(255,107,129,0.25)' },
          ]}
          markers={[
            { depth: modFloor, label: `MOD ${modFloor}`, color: 'var(--warn)', dashed: true },
            ...(effectiveLimit !== 1.6 ? [{ depth: mod16, label: `1.6 ${mod16}`, color: 'var(--danger)', dashed: true }] : []),
          ]}
          surfaceLabel={t('common.surface')}
          unitLabel={unitLabel}
          width={narrow ? 104 : 150}
        />
        <div className="min-w-0 space-y-4">
          <Slider label={t('common.depth')} value={depth} min={0} max={maxDepth} onChange={setDepth} format={(v) => fmtDepth(v)} />
          <div className="grid grid-cols-2 gap-3">
            <Readout
              label={t('sim.modAt', { limit: effectiveLimit.toFixed(1) })}
              value={`${modFloor}`}
              unit={unitLabel}
              tone="warn"
              sub={`${t('sim.exact')}: ${modExact.toFixed(1)}`}
            />
            <Readout
              label="PPO2"
              value={ppo2.toFixed(2)}
              unit={t('common.ata')}
              tone={statusTone[status] === 'safe' ? 'o2' : statusTone[status]}
              sub={t('sim.atDepth', { depth: fmtDepth(depth) })}
            />
          </div>
          <Badge tone={statusTone[status]}>
            {{
              within: t('sim.withinLimit', { limit: effectiveLimit }),
              at: t('sim.atLimit', { limit: effectiveLimit }),
              over: t('sim.pastMod'),
              overContingency: t('sim.overContingency'),
            }[status]}
          </Badge>
          <div className="rounded-2xl border border-line bg-surface-2 p-4">
            <div className="text-[11px] uppercase tracking-[0.12em] text-muted font-semibold">{t('sim.bestMix')}</div>
            <div className="readout text-2xl font-bold text-o2 mt-0.5">
              {Math.round(bestCapped * 100) === 21 ? t('sim.air') : mixName(bestCapped)} <span className="text-sm text-muted font-medium">({Math.round(bestCapped * 100)}%)</span>
            </div>
            <p className="text-xs text-muted mt-1">
              {bestIsCapped ? t('sim.bestMixCapped', { max: maxPct }) : t('sim.bestMixHint', { depth: fmtDepth(depth) })}
            </p>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-line bg-surface-2 p-3">
        <Ppo2DepthChart
          mixes={[
            { fo2, color: 'var(--o2)', label: pct === 21 ? t('sim.air') : mixName(fo2), primary: true },
            { fo2: 0.21, color: 'var(--muted)', label: t('sim.legendAir') },
          ]}
          depth={depth}
          maxDepth={maxDepth}
          units={units}
          limit={effectiveLimit}
          labels={{ depth: t('common.depth'), ppo2: 'PPO2', mod: 'MOD', unit: unitLabel }}
        />
      </div>
    </div>
  );
}

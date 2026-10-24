import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WaterColumn } from './WaterColumn';
import { Ppo2DepthChart } from './Ppo2DepthChart';
import { Slider } from '@/components/ui/Slider';
import { Readout } from '@/components/ui/Readout';
import { Badge } from '@/components/ui/Badge';
import { Segmented } from '@/components/ui/Segmented';
import { gasAtDepth, mixName, mod } from '@/science';
import { useIsNarrow } from '@/app/useMediaQuery';
import { maxDepthFor, ppo2Status, statusTone, useMixLabel, usePlanningLimit, useUnits } from './shared';

export interface DepthPpo2Props {
  fo2Options?: number[];
  initialFo2?: number;
  initialDepth?: number;
  deep?: boolean;
  showChart?: boolean;
  showN2?: boolean;
  lockFo2?: boolean;
}

export function DepthPpo2Explorer({
  fo2Options = [0.21, 0.32, 0.36, 0.4],
  initialFo2 = 0.21,
  initialDepth = 0,
  deep = false,
  showChart = true,
  showN2 = true,
  lockFo2 = false,
}: DepthPpo2Props) {
  const { t } = useTranslation();
  const { units, unitLabel, fmtDepth } = useUnits();
  const [limit] = usePlanningLimit();
  const mixLabel = useMixLabel();
  const narrow = useIsNarrow();
  const maxDepth = maxDepthFor(units, deep);
  const [depth, setDepth] = useState(Math.min(initialDepth, maxDepth));
  const [fo2, setFo2] = useState(initialFo2);
  const g = gasAtDepth(fo2, depth, units);
  const status = ppo2Status(g.ppo2, limit);
  const modDepth = mod(fo2, limit, { unit: units });
  const modContingency = mod(fo2, 1.6, { unit: units });

  const statusText = {
    within: t('sim.withinLimit', { limit }),
    at: t('sim.atLimit', { limit }),
    over: t('sim.overLimit', { limit }),
    overContingency: t('sim.overContingency'),
  }[status];

  const bands = [
    { from: 0, to: Math.min(modDepth, maxDepth), color: 'rgba(61,220,151,0.10)' },
    { from: Math.min(modDepth, maxDepth), to: Math.min(modContingency, maxDepth), color: 'rgba(245,184,61,0.18)' },
    { from: Math.min(modContingency, maxDepth), to: maxDepth, color: 'rgba(255,107,129,0.22)' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-5 grid-cols-[auto_1fr] items-start">
        <WaterColumn
          depth={depth}
          maxDepth={maxDepth}
          units={units}
          onChange={setDepth}
          bands={bands}
          markers={[{ depth: modDepth, label: `MOD ${modDepth}`, color: 'var(--warn)', dashed: true }]}
          surfaceLabel={t('common.surface')}
          unitLabel={unitLabel}
          width={narrow ? 104 : 150}
          height={narrow ? 300 : deep ? 400 : 340}
        />
        <div className="min-w-0 space-y-4">
          {!lockFo2 && (
            <Segmented
              dir="ltr"
              ariaLabel={t('common.mix')}
              size="sm"
              options={fo2Options.map((f) => ({ value: f, label: f === 0.21 ? t('sim.air') : mixName(f) }))}
              value={fo2}
              onChange={setFo2}
              className="flex-wrap"
            />
          )}
          <Slider
            label={t('common.depth')}
            value={depth}
            min={0}
            max={maxDepth}
            onChange={setDepth}
            format={(v) => fmtDepth(v)}
            color="var(--accent)"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Readout label={t('sim.absPressure')} value={g.pAbs.toFixed(2)} unit={t('common.ata')} />
            <Readout label="PPO2" value={g.ppo2.toFixed(2)} unit={t('common.ata')} tone={statusTone[status] === 'safe' ? 'o2' : statusTone[status]} />
            {showN2 && <Readout label="PPN2" value={g.ppn2.toFixed(2)} unit={t('common.ata')} tone="n2" />}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone[status]}>{statusText}</Badge>
            <span className="text-sm text-ink-2">{mixLabel(fo2)}</span>
          </div>
          <p className="text-xs text-muted">{t('sim.columnHint')}</p>
        </div>
      </div>
      {showChart && (
        <div className="rounded-2xl border border-line bg-surface-2 p-3">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted mb-1 px-1">{t('sim.ppo2Chart')}</div>
          <Ppo2DepthChart
            mixes={[
              { fo2, color: 'var(--o2)', label: fo2 === 0.21 ? t('sim.air') : mixName(fo2), primary: true },
              ...(fo2 !== 0.21 ? [{ fo2: 0.21, color: 'var(--muted)', label: t('sim.legendAir') }] : []),
            ]}
            depth={depth}
            maxDepth={maxDepth}
            units={units}
            limit={limit}
            labels={{ depth: t('common.depth'), ppo2: 'PPO2', mod: 'MOD', unit: unitLabel }}
          />
        </div>
      )}
    </div>
  );
}

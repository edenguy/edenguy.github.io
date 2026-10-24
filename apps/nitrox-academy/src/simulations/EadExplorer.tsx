import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Slider } from '@/components/ui/Slider';
import { Segmented } from '@/components/ui/Segmented';
import { Readout } from '@/components/ui/Readout';
import { ead, eadRounded, mixName, ppn2AtDepth } from '@/science';
import { maxDepthFor, useUnits } from './shared';

export function EadExplorer({ initialPct = 32 }: { initialPct?: number }) {
  const { t } = useTranslation();
  const { units, unitLabel, fmtDepth } = useUnits();
  const maxDepth = maxDepthFor(units, false);
  const [depth, setDepth] = useState(units === 'm' ? 30 : 100);
  const [pct, setPct] = useState(initialPct);
  const fo2 = pct / 100;
  const e = Math.max(0, ead(fo2, depth, units));
  const eRounded = eadRounded(fo2, depth, units);
  const W = 360;
  const H = 260;
  const top = 30;
  const y = (d: number) => top + (d / maxDepth) * (H - top - 10);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 md:items-end">
        <Slider label={t('common.depth')} value={depth} min={0} max={maxDepth} onChange={setDepth} format={(v) => fmtDepth(v)} />
        <div>
          <div className="text-sm font-medium text-ink-2 mb-1">{t('sim.nitrox')}</div>
          <Segmented dir="ltr" ariaLabel={t('common.mix')} options={[28, 32, 36, 40].map((p) => ({ value: p, label: mixName(p / 100) }))} value={pct} onChange={setPct} />
        </div>
      </div>
      <div className="grid md:grid-cols-[1fr_auto] gap-5 items-start">
        <div dir="ltr" className="min-w-0">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-2xl border border-line bg-surface-2" role="img" aria-label={t('sim.eadLabel')}>
          <defs>
            <linearGradient id="ead-water" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--n2)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#04101f" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <rect x={0} y={top} width={W} height={H - top} fill="url(#ead-water)" />
          <line x1={0} x2={W} y1={top} y2={top} stroke="var(--accent)" strokeWidth={2} />
          {/* nitrox diver at actual depth */}
          <g transform={`translate(${W * 0.3}, ${y(depth)})`} style={{ transition: 'transform 180ms ease-out' }}>
            <circle r={10} fill="var(--surface)" stroke="var(--o2)" strokeWidth={3} />
            <text y={28} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--ink)" fontFamily="var(--font-mono)">
              {mixName(fo2)} · {depth} {unitLabel}
            </text>
          </g>
          {/* air diver at EAD */}
          <g transform={`translate(${W * 0.7}, ${y(e)})`} style={{ transition: 'transform 180ms ease-out' }}>
            <circle r={10} fill="var(--surface)" stroke="var(--n2)" strokeWidth={3} />
            <text y={28} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--ink)" fontFamily="var(--font-mono)">
              {t('sim.air')} · {e.toFixed(1)} {unitLabel}
            </text>
          </g>
          <line x1={W * 0.3 + 12} y1={y(depth)} x2={W * 0.7 - 12} y2={y(e)} stroke="var(--n2)" strokeDasharray="4 4" />
          <text x={W / 2} y={Math.min(y(depth), y(e)) - 10} textAnchor="middle" fontSize={11} fill="var(--n2)" fontFamily="var(--font-mono)" fontWeight={700}>
            PPN2 = {ppn2AtDepth(fo2, depth, units).toFixed(2)} ata
          </text>
        </svg>
        </div>
        <div className="grid gap-3 min-w-[12rem]">
          <Readout label={t('sim.eadLabel')} value={e.toFixed(1)} unit={unitLabel} tone="n2" sub={`${t('sim.roundedUp')}: ${eRounded} ${unitLabel}`} />
          <Readout label="PPN2" value={ppn2AtDepth(fo2, depth, units).toFixed(2)} unit={t('common.ata')} tone="n2" />
          <p className="text-xs text-muted max-w-[14rem]">{t('sim.eadHint')}</p>
        </div>
      </div>
    </div>
  );
}

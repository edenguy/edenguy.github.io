import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Slider } from '@/components/ui/Slider';
import { Segmented } from '@/components/ui/Segmented';
import { ead, gasAtDepth, mixName, mod } from '@/science';
import { maxDepthFor, usePlanningLimit, useUnits } from './shared';

function Bar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  return (
    <div dir="ltr" className="flex items-center gap-2">
      <div className="h-3 flex-1 rounded-full bg-surface-3 overflow-hidden">
        <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }} />
      </div>
      <span className="readout text-sm font-semibold w-16 text-end">{label}</span>
    </div>
  );
}

export function AirVsNitrox({ initialPct = 32, initialDepth }: { initialPct?: number; initialDepth?: number }) {
  const { t } = useTranslation();
  const { units, fmtDepth } = useUnits();
  const [limit] = usePlanningLimit();
  const maxDepth = maxDepthFor(units, false);
  const [depth, setDepth] = useState(initialDepth ?? (units === 'm' ? 25 : 80));
  const [pct, setPct] = useState(initialPct);
  const fo2 = pct / 100;
  const air = gasAtDepth(0.21, depth, units);
  const nx = gasAtDepth(fo2, depth, units);
  const n2Less = ((air.ppn2 - nx.ppn2) / air.ppn2) * 100;
  const o2More = ((nx.ppo2 - air.ppo2) / air.ppo2) * 100;

  const rows = [
    { key: 'ppo2', label: 'PPO2', a: air.ppo2, n: nx.ppo2, max: 2, color: 'var(--o2)', fmt: (v: number) => `${v.toFixed(2)} ata` },
    { key: 'ppn2', label: 'PPN2', a: air.ppn2, n: nx.ppn2, max: 5, color: 'var(--n2)', fmt: (v: number) => `${v.toFixed(2)} ata` },
    { key: 'ead', label: t('sim.eadLabel'), a: depth, n: Math.max(0, ead(fo2, depth, units)), max: maxDepth, color: 'var(--accent)', fmt: (v: number) => fmtDepth(v, 1) },
    { key: 'mod', label: t('sim.modAt', { limit: limit.toFixed(1) }), a: mod(0.21, limit, { unit: units }), n: mod(fo2, limit, { unit: units }), max: units === 'm' ? 60 : 200, color: 'var(--warn)', fmt: (v: number) => fmtDepth(v) },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 md:items-end">
        <Slider label={t('common.depth')} value={depth} min={0} max={maxDepth} onChange={setDepth} format={(v) => fmtDepth(v)} />
        <div>
          <div className="text-sm font-medium text-ink-2 mb-1">{t('sim.nitrox')}</div>
          <Segmented dir="ltr" ariaLabel={t('common.mix')} options={[28, 32, 36, 40].map((p) => ({ value: p, label: mixName(p / 100) }))} value={pct} onChange={setPct} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:gap-5">
        <div className="rounded-2xl border border-line bg-surface-2 p-4">
          <div className="font-semibold text-ink mb-3 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-muted" /> {t('sim.air')} <span className="text-muted text-sm">21%</span>
          </div>
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.key}>
                <div className="text-[11px] uppercase tracking-[0.1em] text-muted font-semibold mb-1">{r.label}</div>
                <Bar value={r.a} max={r.max} color="var(--muted)" label={r.fmt(r.a)} />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-o2/40 bg-o2-soft p-4">
          <div className="font-semibold text-ink mb-3 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-o2" /> {mixName(fo2)} <span className="text-muted text-sm">{pct}%</span>
          </div>
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.key}>
                <div className="text-[11px] uppercase tracking-[0.1em] text-muted font-semibold mb-1">{r.label}</div>
                <Bar value={r.n} max={r.max} color={r.color} label={r.fmt(r.n)} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-n2-soft border border-n2/30 px-4 py-3 text-ink-2">
          <span className="readout font-bold text-n2">−{n2Less.toFixed(0)}%</span> {t('sim.n2Reduction')}
        </div>
        <div className="rounded-xl bg-o2-soft border border-o2/30 px-4 py-3 text-ink-2">
          <span className="readout font-bold text-o2">+{o2More.toFixed(0)}%</span> {t('sim.o2Increase')}
        </div>
      </div>
    </div>
  );
}

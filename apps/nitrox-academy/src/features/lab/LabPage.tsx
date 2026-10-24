import { useEffect } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Segmented } from '@/components/ui/Segmented';
import { Callout } from '@/components/ui/Callout';
import { Badge } from '@/components/ui/Badge';
import { useProgress } from '@/progress/store';
import { usePlanningLimit } from '@/simulations/shared';
import { GasCompositionExplorer } from '@/simulations/GasCompositionExplorer';
import { DepthPpo2Explorer } from '@/simulations/DepthPpo2Explorer';
import { ModExplorer } from '@/simulations/ModExplorer';
import { ModCalculator } from '@/simulations/ModCalculator';
import { AirVsNitrox } from '@/simulations/AirVsNitrox';
import { EadExplorer } from '@/simulations/EadExplorer';

const TOOLS: { id: string; key: string; blurb: string; icon: IconName }[] = [
  { id: 'gas', key: 'lab.gas', blurb: 'lab.gasBlurb', icon: 'atom' },
  { id: 'depth', key: 'lab.depth', blurb: 'lab.depthBlurb', icon: 'gauge' },
  { id: 'mod', key: 'lab.mod', blurb: 'lab.modBlurb', icon: 'target' },
  { id: 'compare', key: 'lab.compare', blurb: 'lab.compareBlurb', icon: 'wave' },
  { id: 'ead', key: 'lab.ead', blurb: 'lab.eadBlurb', icon: 'clock' },
];

export function LabPage() {
  const { t } = useTranslation();
  const { tool = 'gas' } = useParams();
  const visitLab = useProgress((s) => s.visitLab);
  const [limit, setLimit] = usePlanningLimit();
  useEffect(() => {
    visitLab();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const active = TOOLS.find((x) => x.id === tool) ?? TOOLS[0]!;

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow={t('nav.lab')} title={t('lab.title')} body={t('lab.subtitle')} />

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
        {TOOLS.map((x) => (
          <NavLink
            key={x.id}
            to={`/lab/${x.id}`}
            className={({ isActive }) =>
              clsx(
                'shrink-0 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                isActive || (tool === x.id) ? 'bg-accent text-accent-ink border-accent' : 'bg-surface-2 border-line text-ink-2 hover:text-ink',
              )
            }
          >
            <Icon name={x.icon} size={16} /> {t(x.key)}
          </NavLink>
        ))}
        <span className="shrink-0 inline-flex items-center gap-2 rounded-full border border-dashed border-line px-4 py-2 text-sm text-muted">
          <Icon name="beaker" size={16} /> {t('common.comingSoon')}
        </span>
      </div>

      <Card className="relative overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl text-ink flex items-center gap-2">
              <Icon name={active.icon} className="text-accent" /> {t(active.key)}
            </h2>
            <p className="text-sm text-ink-2 mt-1">{t(active.blurb)}</p>
          </div>
          {(tool === 'depth' || tool === 'compare') && (
            <div className="text-end">
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted font-semibold mb-1">{t('lab.ppo2Limit')}</div>
              <Segmented
                dir="ltr"
                size="sm"
                ariaLabel={t('lab.ppo2Limit')}
                options={[
                  { value: 1.4, label: '1.4', hint: t('lab.limitWorking') },
                  { value: 1.6, label: '1.6', hint: t('lab.limitContingency') },
                ]}
                value={limit}
                onChange={setLimit}
              />
            </div>
          )}
        </div>

        {tool === 'gas' && <GasCompositionExplorer max={100} presets={[21, 32, 36, 40, 50, 100]} />}
        {tool === 'depth' && <DepthPpo2Explorer deep fo2Options={[0.21, 0.28, 0.32, 0.36, 0.4]} />}
        {tool === 'mod' && (
          <div className="space-y-8">
            <ModExplorer minPct={21} maxPct={50} />
            <div className="border-t border-line pt-6">
              <h3 className="text-lg text-ink mb-3">{t('sim.calcTitle')}</h3>
              <ModCalculator limits={[1.2, 1.3, 1.4, 1.5, 1.6]} maxPct={50} />
            </div>
          </div>
        )}
        {tool === 'compare' && <AirVsNitrox />}
        {tool === 'ead' && <EadExplorer />}
      </Card>

      {(tool === 'depth' || tool === 'mod' || tool === 'compare') && (
        <Callout variant="standard" title={t('lab.ppo2Limit')}>
          {t('lab.limitNote')}
        </Callout>
      )}
      <Callout variant="safety">{t('lab.scope')}</Callout>
      <div className="flex items-center gap-2 text-sm text-muted">
        <Badge>{t('common.comingSoon')}</Badge> {t('lab.comingSoon')}
      </div>
    </div>
  );
}

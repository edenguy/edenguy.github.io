import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useProgress } from '@/progress/store';
import { depthPerAtmosphere, mixName, type DepthUnit } from '@/science';

export function useUnits(): { units: DepthUnit; perAtm: number; unitLabel: string; fmtDepth: (d: number, decimals?: number) => string } {
  const units = useProgress((s) => s.settings.units);
  const { t } = useTranslation();
  const unitLabel = t(`common.${units}`);
  const fmtDepth = useCallback(
    (d: number, decimals = 0) => `${d.toFixed(decimals)} ${unitLabel}`,
    [unitLabel],
  );
  return { units, perAtm: depthPerAtmosphere(units), unitLabel, fmtDepth };
}

export function usePlanningLimit(): [number, (v: number) => void] {
  const limit = useProgress((s) => s.settings.ppo2Limit);
  const setLimit = useProgress((s) => s.setPpo2Limit);
  return [limit, setLimit];
}

export function useMixLabel(): (fo2: number) => string {
  const { t } = useTranslation();
  return (fo2: number) => {
    const name = mixName(fo2);
    const label = name === 'Air' ? t('sim.air') : name;
    return t('sim.mixLabel', { name: label, pct: Math.round(fo2 * 100) });
  };
}

/** Max depth shown in column/charts per unit system. */
export function maxDepthFor(units: DepthUnit, deep = false): number {
  if (units === 'm') return deep ? 60 : 40;
  return deep ? 200 : 130;
}

export function depthStep(units: DepthUnit): number {
  return units === 'm' ? 10 : 33;
}

export type Ppo2Status = 'within' | 'at' | 'over' | 'overContingency';

export function ppo2Status(ppo2: number, limit: number): Ppo2Status {
  if (ppo2 > 1.6 + 1e-9 && limit <= 1.6) return 'overContingency';
  if (ppo2 > limit + 1e-9) return 'over';
  if (Math.abs(ppo2 - limit) < 0.015) return 'at';
  return 'within';
}

export const statusTone: Record<Ppo2Status, 'safe' | 'warn' | 'danger'> = {
  within: 'safe',
  at: 'warn',
  over: 'danger',
  overContingency: 'danger',
};

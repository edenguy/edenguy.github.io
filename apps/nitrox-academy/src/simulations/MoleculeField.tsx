import { useMemo } from 'react';
import { useReducedMotion } from '@/app/useReducedMotion';
import { useTranslation } from 'react-i18next';

/** Deterministic pseudo-random order so molecules "turn" into oxygen in a natural scatter. */
function shuffledIndices(n: number, seed = 7): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  let s = seed;
  for (let i = n - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

/**
 * 100 molecules in a circular "breath". `fo2` decides how many are oxygen.
 * Molecules are placed on a sunflower spiral so the field is round and even.
 */
export function MoleculeField({ fo2, size = 260, className }: { fo2: number; size?: number; className?: string }) {
  const reduced = useReducedMotion();
  const { t } = useTranslation();
  const count = 100;
  const o2Count = Math.round(fo2 * count);
  const order = useMemo(() => shuffledIndices(count), []);
  const rank = useMemo(() => {
    const r = new Array<number>(count);
    order.forEach((idx, pos) => (r[idx] = pos));
    return r;
  }, [order]);
  const points = useMemo(() => {
    const golden = Math.PI * (3 - Math.sqrt(5));
    return Array.from({ length: count }, (_, i) => {
      const r = Math.sqrt((i + 0.5) / count) * 0.92;
      const a = i * golden;
      return { x: 0.5 + (r * Math.cos(a)) / 2, y: 0.5 + (r * Math.sin(a)) / 2 };
    });
  }, []);
  const dot = size / 26;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} role="img" aria-label={t('sim.moleculesAria', { o2: o2Count, n2: 100 - o2Count })}>
      <defs>
        <radialGradient id="breath-bg" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="var(--surface-3)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--surface-2)" stopOpacity="0.4" />
        </radialGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={size / 2 - 2} fill="url(#breath-bg)" stroke="var(--line)" />
      {points.map((p, i) => {
        const isO2 = (rank[i] ?? 0) < o2Count;
        const dx = ((i % 5) - 2) * 1.2;
        const dy = ((i % 7) - 3) * 1.1;
        return (
          <g
            key={i}
            className={reduced ? undefined : 'anim-drift'}
            style={{ ['--dx' as string]: `${dx}px`, ['--dy' as string]: `${dy}px`, ['--dur' as string]: `${5 + (i % 5)}s` }}
          >
            <circle
              cx={p.x * size}
              cy={p.y * size}
              r={dot / 2}
              fill={isO2 ? 'var(--o2)' : 'var(--n2)'}
              style={{ transition: reduced ? undefined : 'fill 500ms ease' }}
              opacity={isO2 ? 1 : 0.85}
            />
          </g>
        );
      })}
    </svg>
  );
}

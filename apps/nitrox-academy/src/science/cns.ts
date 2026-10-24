import { CNS_HALFTIME_MIN } from './limits';
import { gasAtDepth } from './gas';
import { totalExposure, type ExposureSegment } from './oxygenExposure';
import type { DepthUnit } from './constants';
import { assertFinite, assertFo2, assertRange } from './validate';

/**
 * CNS "oxygen clock" decay during a surface interval.
 *
 * This is the simplified 90-minute half-time model used by many dive computers and
 * recreational texts (see `limits.ts` `CNS_HALFTIME_MIN`) — it is NOT a NOAA value, and the
 * UI must label it as a simplified/teaching model whose computer's model may differ.
 *
 *   cnsAfterInterval = cnsPercent × 0.5^(surfaceIntervalMin / CNS_HALFTIME_MIN)
 *
 * Never goes below 0; a 0-minute interval returns the input unchanged (identity).
 */
export function cnsAfterInterval(cnsPercent: number, surfaceIntervalMin: number): number {
  assertFinite(cnsPercent, 'cnsPercent');
  assertFinite(surfaceIntervalMin, 'surfaceIntervalMin');
  assertRange(cnsPercent, 0, 1_000_000, 'cnsPercent');
  assertRange(surfaceIntervalMin, 0, 1_000_000, 'surfaceIntervalMin');
  return Math.max(0, cnsPercent * 0.5 ** (surfaceIntervalMin / CNS_HALFTIME_MIN));
}

/** One dive's plan: the mix breathed and the depth/time segments that make it up. */
export interface DivePlanInput {
  fo2: number;
  segments: { depth: number; minutes: number }[];
  unit?: DepthUnit;
}

/** A dive plan's segment, annotated with the depth and PPO2 it produces. */
export type DiveExposureSegment = ExposureSegment & { depth: number; ppo2: number };

export interface DiveExposure {
  /** Null if any segment's PPO2 exceeds the NOAA table (> 1.6 ata): no recreational limit exists there. */
  cnsPercent: number | null;
  otu: number;
  maxPpo2: number;
  maxDepth: number;
  segments: DiveExposureSegment[];
}

/**
 * Oxygen exposure (CNS% and OTU) for a single dive made of depth/time segments on one mix.
 * Uses `gasAtDepth()` for each segment's PPO2 and `totalExposure()` to sum CNS% and OTU.
 */
export function diveExposure(input: DivePlanInput, unit?: DepthUnit): DiveExposure {
  assertFo2(input.fo2);
  const u: DepthUnit = unit ?? input.unit ?? 'm';
  const segments: DiveExposureSegment[] = input.segments.map((seg) => {
    assertFinite(seg.depth, 'depth');
    assertFinite(seg.minutes, 'minutes');
    assertRange(seg.minutes, 0, 1_000_000, 'minutes');
    const g = gasAtDepth(input.fo2, seg.depth, u);
    return { depth: seg.depth, minutes: seg.minutes, ppo2: g.ppo2 };
  });
  const totals = totalExposure(segments);
  const maxPpo2 = segments.length ? Math.max(...segments.map((s) => s.ppo2)) : 0;
  const maxDepth = segments.length ? Math.max(...segments.map((s) => s.depth)) : 0;
  return { cnsPercent: totals.cnsPercent, otu: totals.otu, maxPpo2, maxDepth, segments };
}

export interface RepetitiveExposure {
  perDive: DiveExposure[];
  /** Running CNS% at the start of each dive's surface phase, after decay from the previous one. */
  cumulativeCns: (number | null)[];
  cumulativeOtu: number;
}

/**
 * Multiple dives in a day, with a surface interval (minutes) before each dive after the first.
 *   cumulativeCns[0]  = perDive[0].cnsPercent
 *   cumulativeCns[i]  = cnsAfterInterval(cumulativeCns[i-1], surfaceIntervalsMin[i-1]) + perDive[i].cnsPercent
 * Null propagates: once any dive (or the running total) is null, every later entry is null too,
 * since OTU has no decay model and always accumulates, cumulativeOtu sums every dive's OTU
 * regardless of CNS validity.
 */
export function repetitiveExposure(dives: DivePlanInput[], surfaceIntervalsMin: number[]): RepetitiveExposure {
  const perDive = dives.map((d) => diveExposure(d));
  const cumulativeCns: (number | null)[] = [];
  let running: number | null = null;
  let cumulativeOtu = 0;
  perDive.forEach((dive, i) => {
    if (i === 0) {
      running = dive.cnsPercent;
    } else {
      const interval = surfaceIntervalsMin[i - 1] ?? 0;
      assertFinite(interval, 'surfaceIntervalMin');
      assertRange(interval, 0, 1_000_000, 'surfaceIntervalMin');
      const decayed = running === null ? null : cnsAfterInterval(running, interval);
      running = decayed === null || dive.cnsPercent === null ? null : decayed + dive.cnsPercent;
    }
    cumulativeCns.push(running);
    cumulativeOtu += dive.otu;
  });
  return { perDive, cumulativeCns, cumulativeOtu };
}

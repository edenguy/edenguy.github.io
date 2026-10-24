import {
  NOAA_CNS_THRESHOLD_PPO2,
  NOAA_OXYGEN_EXPOSURE_LIMITS,
  OTU_EXPONENT,
  OTU_THRESHOLD_PPO2,
} from './limits';
import { assertFinite, assertRange } from './validate';

/**
 * NOAA single-exposure limit (minutes) for a PPO2, using the table row at or above the
 * given PPO2 (conservative). Returns Infinity below the 0.5 ata threshold and null above 1.6.
 */
export function noaaSingleExposureLimit(ppo2: number): number | null {
  assertFinite(ppo2, 'ppo2');
  if (ppo2 <= NOAA_CNS_THRESHOLD_PPO2) return Infinity;
  if (ppo2 > 1.6 + 1e-9) return null;
  // Table is sorted descending; pick the smallest table PPO2 that is >= ppo2.
  let row = NOAA_OXYGEN_EXPOSURE_LIMITS[0]!;
  for (const r of NOAA_OXYGEN_EXPOSURE_LIMITS) {
    if (r.ppo2 + 1e-9 >= ppo2) row = r;
  }
  return row.singleExposureMin;
}

export function noaaDailyLimit(ppo2: number): number | null {
  assertFinite(ppo2, 'ppo2');
  if (ppo2 <= NOAA_CNS_THRESHOLD_PPO2) return Infinity;
  if (ppo2 > 1.6 + 1e-9) return null;
  let row = NOAA_OXYGEN_EXPOSURE_LIMITS[0]!;
  for (const r of NOAA_OXYGEN_EXPOSURE_LIMITS) {
    if (r.ppo2 + 1e-9 >= ppo2) row = r;
  }
  return row.dailyMin;
}

/**
 * CNS "oxygen clock" percentage for a constant-PPO2 exposure:
 *   CNS% = minutes / single-exposure-limit × 100
 * Uses the NOAA table row at or above the PPO2 (conservative step lookup, the method most
 * recreational texts teach). Returns null when PPO2 exceeds the table (> 1.6 ata): no
 * recreational limit exists there and the UI must say "outside limits".
 */
export function cnsPercent(ppo2: number, minutes: number): number | null {
  assertFinite(minutes, 'minutes');
  assertRange(minutes, 0, 100000, 'minutes');
  const limit = noaaSingleExposureLimit(ppo2);
  if (limit === null) return null;
  if (!Number.isFinite(limit)) return 0;
  return (minutes / limit) * 100;
}

/**
 * Oxygen Tolerance Units (Bardin & Lambertsen / REPEX):
 *   OTU = t × ((PO2 − 0.5) / 0.5)^0.83, zero at or below 0.5 ata.
 */
export function otu(ppo2: number, minutes: number): number {
  assertFinite(ppo2, 'ppo2');
  assertFinite(minutes, 'minutes');
  assertRange(minutes, 0, 100000, 'minutes');
  if (ppo2 <= OTU_THRESHOLD_PPO2) return 0;
  return minutes * ((ppo2 - OTU_THRESHOLD_PPO2) / 0.5) ** OTU_EXPONENT;
}

/** A segment of constant PPO2 for multi-level exposure sums. */
export interface ExposureSegment {
  ppo2: number;
  minutes: number;
}

export interface ExposureTotals {
  cnsPercent: number | null;
  otu: number;
}

/** Sum CNS% and OTU across segments; CNS is null if any segment is beyond the table. */
export function totalExposure(segments: readonly ExposureSegment[]): ExposureTotals {
  let cns: number | null = 0;
  let otuTotal = 0;
  for (const s of segments) {
    const c = cnsPercent(s.ppo2, s.minutes);
    cns = cns === null || c === null ? null : cns + c;
    otuTotal += otu(s.ppo2, s.minutes);
  }
  return { cnsPercent: cns, otu: otuTotal };
}

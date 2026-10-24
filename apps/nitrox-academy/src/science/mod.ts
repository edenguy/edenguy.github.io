import { depthPerAtmosphere, SURFACE_PRESSURE_BAR, type DepthUnit } from './constants';
import { absolutePressure } from './pressure';
import { assertFo2, assertPpo2 } from './validate';

export interface ModOptions {
  unit?: DepthUnit;
  /**
   * 'floor' (default) rounds DOWN to the whole metre/foot, which is how training agencies
   * and the NOAA MOD tables present MOD. 'exact' returns the unrounded value for charts.
   */
  rounding?: 'floor' | 'exact';
}

/**
 * Maximum Operating Depth: the depth at which a mix reaches the chosen PPO2 limit.
 *   MOD = (PPO2_limit / FO2 − 1) × (depth per atmosphere)
 */
export function mod(fo2: number, ppo2Limit: number, options: ModOptions = {}): number {
  assertFo2(fo2);
  assertPpo2(ppo2Limit);
  const { unit = 'm', rounding = 'floor' } = options;
  const exact = (ppo2Limit / fo2 - SURFACE_PRESSURE_BAR) * depthPerAtmosphere(unit);
  const clamped = Math.max(0, exact);
  // Guard against floating-point noise such as 39.99999 → 39 for an exact 40.
  return rounding === 'floor' ? Math.floor(clamped + 1e-9) : clamped;
}

/** Step-by-step record of a MOD calculation for the guided calculator UI. */
export interface ModSteps {
  fo2: number;
  ppo2Limit: number;
  unit: DepthUnit;
  /** PPO2_limit / FO2: the absolute pressure at which the limit is reached. */
  pAbsAtLimit: number;
  /** pAbsAtLimit − 1: the pressure due to water alone. */
  gaugeAtLimit: number;
  /** Unrounded depth. */
  exactDepth: number;
  /** Rounded-down depth, as it would be written on a cylinder label. */
  mod: number;
}

export function modSteps(fo2: number, ppo2Limit: number, unit: DepthUnit = 'm'): ModSteps {
  assertFo2(fo2);
  assertPpo2(ppo2Limit);
  const pAbsAtLimit = ppo2Limit / fo2;
  const gaugeAtLimit = pAbsAtLimit - SURFACE_PRESSURE_BAR;
  const exactDepth = Math.max(0, gaugeAtLimit * depthPerAtmosphere(unit));
  return {
    fo2,
    ppo2Limit,
    unit,
    pAbsAtLimit,
    gaugeAtLimit,
    exactDepth,
    mod: Math.floor(exactDepth + 1e-9),
  };
}

/**
 * Best mix: the highest oxygen fraction that keeps PPO2 at or below the limit at a depth.
 *   FO2 = PPO2_limit / P_abs(depth)
 * Returned as a fraction rounded DOWN to a whole percent (0.3256 → 0.32), capped at 1.0.
 */
export function bestMix(depth: number, ppo2Limit: number, unit: DepthUnit = 'm'): number {
  assertPpo2(ppo2Limit);
  const exact = ppo2Limit / absolutePressure(depth, unit);
  return Math.min(1, Math.floor(exact * 100 + 1e-9) / 100);
}

/** Unrounded best-mix fraction, for charts. */
export function bestMixExact(depth: number, ppo2Limit: number, unit: DepthUnit = 'm'): number {
  assertPpo2(ppo2Limit);
  return Math.min(1, ppo2Limit / absolutePressure(depth, unit));
}

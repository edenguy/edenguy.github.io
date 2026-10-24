import { AIR_FN2, depthPerAtmosphere, type DepthUnit } from './constants';
import { assertFinite, assertFo2, assertRange } from './validate';

/**
 * Equivalent Air Depth: the depth at which air would have the same nitrogen partial
 * pressure as the Nitrox mix at the actual depth.
 *   EAD = ((1 − FO2) × (D + 10) / 0.79) − 10   (metres; 33 for feet)
 * Returned unrounded; agencies round to the next whole unit for table use (see `eadRounded`).
 */
export function ead(fo2: number, depth: number, unit: DepthUnit = 'm'): number {
  assertFo2(fo2);
  assertFinite(depth, 'depth');
  assertRange(depth, 0, 1000, 'depth');
  const d = depthPerAtmosphere(unit);
  return ((1 - fo2) * (depth + d)) / AIR_FN2 - d;
}

/**
 * EAD rounded the conservative way for air-table lookup: UP to the next whole metre/foot,
 * never below zero.
 */
export function eadRounded(fo2: number, depth: number, unit: DepthUnit = 'm'): number {
  return Math.max(0, Math.ceil(ead(fo2, depth, unit) - 1e-9));
}

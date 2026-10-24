import { SURFACE_PRESSURE_BAR, depthPerAtmosphere, type DepthUnit } from './constants';
import { assertFinite, assertRange } from './validate';

/**
 * Absolute pressure (ata / bar) at a depth in seawater.
 * P_abs = depth / (depth per atmosphere) + surface pressure.
 */
export function absolutePressure(depth: number, unit: DepthUnit = 'm', surfacePressure = SURFACE_PRESSURE_BAR): number {
  assertFinite(depth, 'depth');
  assertRange(depth, 0, 1000, 'depth');
  return depth / depthPerAtmosphere(unit) + surfacePressure;
}

/** Gauge pressure (what a depth gauge reads): pressure due to water only. */
export function gaugePressure(depth: number, unit: DepthUnit = 'm'): number {
  assertFinite(depth, 'depth');
  assertRange(depth, 0, 1000, 'depth');
  return depth / depthPerAtmosphere(unit);
}

/** Depth at which the absolute pressure equals `pAbs`. */
export function depthForAbsolutePressure(pAbs: number, unit: DepthUnit = 'm', surfacePressure = SURFACE_PRESSURE_BAR): number {
  assertFinite(pAbs, 'pAbs');
  if (pAbs < surfacePressure) throw new RangeError('Absolute pressure cannot be below surface pressure');
  return (pAbs - surfacePressure) * depthPerAtmosphere(unit);
}

/** Convert depth between metres and feet (exact factor; display rounding is the caller's job). */
export function convertDepth(value: number, from: DepthUnit, to: DepthUnit): number {
  if (from === to) return value;
  return from === 'm' ? value / 0.3048 : value * 0.3048;
}

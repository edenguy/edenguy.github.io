/**
 * Physical and conventional constants used by the Nitrox Academy calculation engine.
 *
 * Every value here is either a physical fact or an explicitly named teaching
 * convention. Agency planning limits (e.g. 1.4 ata) are NOT constants of nature;
 * they live in `limits.ts` with their provenance.
 */

/** Oxygen fraction of dry atmospheric air used for dive-planning arithmetic (agency convention). */
export const AIR_FO2 = 0.21;
/** Nitrogen fraction of air used for dive-planning arithmetic (agency convention, treats argon etc. as nitrogen). */
export const AIR_FN2 = 0.79;
/** Precise oxygen fraction of dry air, as used when calibrating an analyzer in air. */
export const AIR_FO2_PRECISE = 0.209;

/** Sea-level atmospheric pressure in bar (1 atm = 1.01325 bar; diving arithmetic treats 1 atm ≈ 1 bar). */
export const SURFACE_PRESSURE_BAR = 1.0;

/**
 * Teaching convention: 10 metres of seawater adds 1 bar.
 * Physically, with seawater at ~1025 kg/m³, 1 bar ≈ 9.95 m and 1 atm ≈ 10.08 m (EN 13319
 * defines 1 msw = 10.0381 kPa). Training agencies use 10 msw/bar.
 */
export const MSW_PER_BAR = 10;

/**
 * Teaching convention: 33 feet of seawater adds 1 atmosphere (US customary).
 */
export const FSW_PER_ATM = 33;

export type DepthUnit = 'm' | 'ft';

export function depthPerAtmosphere(unit: DepthUnit): number {
  return unit === 'm' ? MSW_PER_BAR : FSW_PER_ATM;
}

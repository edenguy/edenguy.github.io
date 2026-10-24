import { AIR_FO2 } from './constants';
import { absolutePressure } from './pressure';
import type { DepthUnit } from './constants';
import { assertFo2 } from './validate';

/** A binary nitrogen/oxygen mix. Fractions are 0..1 and sum to 1. */
export interface GasMix {
  fo2: number;
  fn2: number;
}

/** Create a Nitrox mix from an oxygen fraction (0.21 = air, 0.32 = EAN32). */
export function nitrox(fo2: number): GasMix {
  assertFo2(fo2);
  return { fo2, fn2: round(1 - fo2, 6) };
}

/** Create a mix from a whole-number oxygen percentage (32 → EAN32). */
export function eanx(percent: number): GasMix {
  return nitrox(percent / 100);
}

export const AIR: GasMix = Object.freeze(nitrox(AIR_FO2));

/** "EAN32", "Air", "Oxygen" style label. */
export function mixName(mix: GasMix | number): string {
  const fo2 = typeof mix === 'number' ? mix : mix.fo2;
  const pct = Math.round(fo2 * 100);
  if (pct === 21) return 'Air';
  if (pct === 100) return 'O2';
  return `EAN${pct}`;
}

/** Dalton's law: the partial pressure of a gas is its fraction times the absolute pressure. */
export function partialPressure(fraction: number, absolutePressureAta: number): number {
  return fraction * absolutePressureAta;
}

/** PPO2 of a mix at depth. */
export function ppo2AtDepth(fo2: number, depth: number, unit: DepthUnit = 'm'): number {
  assertFo2(fo2);
  return partialPressure(fo2, absolutePressure(depth, unit));
}

/** PPN2 of a mix at depth. */
export function ppn2AtDepth(fo2: number, depth: number, unit: DepthUnit = 'm'): number {
  assertFo2(fo2);
  return partialPressure(1 - fo2, absolutePressure(depth, unit));
}

/** Both partial pressures plus the ambient pressure, for instrument displays. */
export interface GasAtDepth {
  depth: number;
  unit: DepthUnit;
  pAbs: number;
  ppo2: number;
  ppn2: number;
}

export function gasAtDepth(fo2: number, depth: number, unit: DepthUnit = 'm'): GasAtDepth {
  assertFo2(fo2);
  const pAbs = absolutePressure(depth, unit);
  return { depth, unit, pAbs, ppo2: fo2 * pAbs, ppn2: (1 - fo2) * pAbs };
}

export function round(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

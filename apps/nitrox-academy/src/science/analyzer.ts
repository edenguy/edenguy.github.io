import { AIR_FO2_PRECISE } from './constants';
import { round } from './gas';
import { assertFinite, assertFo2, assertRange } from './validate';

/**
 * Deterministic, time-stepped model of a galvanic-cell oxygen analyzer, for the
 * `VirtualAnalyzer` simulator. Pure, no DOM — the UI drives it by calling `analyzerStep` on a
 * timer. The constants below are *teaching* approximations, not manufacturer data; the UI
 * must say so once (`sim.analyzer.modelNote`).
 */
export const ANALYZER_FAULT_IDS = [
  'none',
  'not-calibrated', // CAL left at factory offset: reads e.g. 19.4 in air
  'calibrated-on-wrong-gas', // user calibrated to 20.9 while sampling the cylinder
  'aging-cell', // output low: cannot reach 20.9 even at max CAL; drifts down further while sampling
  'unstable-cell', // reading jumps randomly (seeded)
  'flow-too-high', // > 3 L/min: reads high (pressurisation of the sensor)
  'flow-too-low', // < 0.5 L/min: rises very slowly, never reaches true value in time
  'residual-gas', // previous sample (e.g. 36 %) still in the sensor cup: starts high, decays
  'temperature', // cold cell: slow response (time constant ×3)
  'low-battery', // display dims/blinks, reading sticks
] as const;
export type AnalyzerFaultId = (typeof ANALYZER_FAULT_IDS)[number];

export interface AnalyzerState {
  seed: number;
  powered: boolean;
  /** Knob position, −3.0 … +3.0 (% O2 added to raw output). */
  calOffset: number;
  /** 1.0 healthy; lower for an aging cell. */
  cellGain: number;
  /** 0 … 5 L/min. */
  flowLpm: number;
  /** Valve open on the cylinder. */
  sampling: boolean;
  /** Cylinder contents (hidden from the learner in the UI). */
  trueFo2: number;
  ambientFo2: number;
  /** Gas actually at the sensor; lags behind the source gas with a flow-dependent time constant. */
  sensorFo2: number;
  /** What the LCD shows (% O2, 1 decimal). */
  display: number;
  tSeconds: number;
  fault: AnalyzerFaultId;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Deterministic pseudo-random value in [-1, 1] from a seed and the simulated time (a small
 * integer hash, not cryptographic). It only needs to be reproducible: the same seed and the
 * same sequence of `analyzerStep` calls always produce the same trajectory.
 */
function seededUnit(seed: number, tSeconds: number): number {
  let h = (Math.imul(seed | 0, 2654435761) ^ Math.round(tSeconds * 1000)) | 0;
  h = Math.imul(h ^ (h >>> 16), 2246822519);
  h = Math.imul(h ^ (h >>> 13), 3266489917);
  h = (h ^ (h >>> 16)) >>> 0;
  return (h / 0xffffffff) * 2 - 1;
}

/**
 * Create a fresh analyzer. `trueFo2` is the cylinder's actual contents; `fault` presets a
 * failure scenario's starting condition (see `ANALYZER_FAULT_IDS` and the Model notes below).
 */
export function createAnalyzer(opts: { trueFo2: number; fault?: AnalyzerFaultId; seed?: number }): AnalyzerState {
  assertFo2(opts.trueFo2);
  const fault = opts.fault ?? 'none';
  const seed = opts.seed ?? 1;
  let calOffset = 0;
  let cellGain = 1.0;
  let sensorFo2: number = AIR_FO2_PRECISE;
  let sampling = false;
  // Each fault's starting condition (LLD §4.3 "Model"). Faults with no special starting
  // condition (unstable-cell, flow-too-high/low, temperature, low-battery, none) emerge from
  // the shared step formulas below instead.
  if (fault === 'not-calibrated') calOffset = -1.5;
  if (fault === 'aging-cell') cellGain = 0.85;
  if (fault === 'residual-gas') sensorFo2 = 0.36;
  if (fault === 'calibrated-on-wrong-gas') sampling = true;
  return {
    seed,
    powered: true,
    calOffset,
    cellGain,
    flowLpm: 0,
    sampling,
    trueFo2: opts.trueFo2,
    ambientFo2: AIR_FO2_PRECISE,
    sensorFo2,
    display: round(sensorFo2 * 100 * cellGain + calOffset, 1),
    tSeconds: 0,
    fault,
  };
}

/**
 * Advance the simulation by `dtSeconds`. The sensor gas chases the source gas (ambient air or
 * cylinder contents, depending on `sampling`) with a flow-dependent time constant:
 *   tau = clamp(12 / max(flowLpm, 0.2), 4, 90) seconds, ×3 for the `temperature` fault
 *   sensorFo2 += (source − sensorFo2) × (1 − exp(−dt / tau))
 * The display is the raw cell output plus the CAL offset, a high-flow pressurisation bias,
 * and noise:
 *   raw = sensorFo2 × 100 × cellGain
 *   flowBias = flowLpm > 3 ? 0.3 × (flowLpm − 3) : 0
 *   display = round1(raw + calOffset + flowBias + noise)
 * `noise` is seeded ±0.05 normally, ±0.7 for `unstable-cell`. `aging-cell` additionally loses
 * 0.001 of `cellGain` per minute spent sampling. `low-battery` freezes the display on
 * alternating seconds.
 */
export function analyzerStep(s: AnalyzerState, dtSeconds: number): AnalyzerState {
  assertFinite(dtSeconds, 'dtSeconds');
  assertRange(dtSeconds, 0, 3600, 'dtSeconds');
  const tSeconds = s.tSeconds + dtSeconds;

  const source = s.sampling ? s.trueFo2 : s.ambientFo2;
  const flowTau = clamp(12 / Math.max(s.flowLpm, 0.2), 4, 90);
  const tau = s.fault === 'temperature' ? flowTau * 3 : flowTau;
  const sensorFo2 = s.sensorFo2 + (source - s.sensorFo2) * (1 - Math.exp(-dtSeconds / tau));

  const cellGain =
    s.fault === 'aging-cell' && s.sampling ? Math.max(0.5, s.cellGain - 0.001 * (dtSeconds / 60)) : s.cellGain;

  const raw = sensorFo2 * 100 * cellGain;
  const flowBias = s.flowLpm > 3 ? 0.3 * (s.flowLpm - 3) : 0;
  const noiseScale = s.fault === 'unstable-cell' ? 0.7 : 0.05;
  const noise = seededUnit(s.seed, tSeconds) * noiseScale;
  const computed = round(raw + s.calOffset + flowBias + noise, 1);
  const frozen = s.fault === 'low-battery' && Math.floor(tSeconds) % 2 === 1;

  return { ...s, sensorFo2, cellGain, display: frozen ? s.display : computed, tSeconds };
}

export function analyzerSetCal(s: AnalyzerState, calOffset: number): AnalyzerState {
  assertFinite(calOffset, 'calOffset');
  assertRange(calOffset, -3, 3, 'calOffset');
  return { ...s, calOffset };
}

export function analyzerSetFlow(s: AnalyzerState, flowLpm: number): AnalyzerState {
  assertFinite(flowLpm, 'flowLpm');
  assertRange(flowLpm, 0, 5, 'flowLpm');
  return { ...s, flowLpm };
}

export function analyzerSample(s: AnalyzerState, on: boolean): AnalyzerState {
  return { ...s, sampling: on };
}

/**
 * True once the trailing `windowSec` readings (one per second of simulated time) vary by no
 * more than `tol`. False while there is not yet `windowSec` seconds of history.
 */
export function analyzerIsStable(history: number[], windowSec: number, tol: number): boolean {
  if (windowSec <= 0 || history.length < windowSec) return false;
  const window = history.slice(-windowSec);
  const max = Math.max(...window);
  const min = Math.min(...window);
  return max - min <= tol + 1e-9;
}

/** i18n keys (not text) describing a fault, for the "Identify the problem" explanation panel. */
export function describeFault(id: AnalyzerFaultId): { symptom: string; cause: string; action: string } {
  return {
    symptom: `sim.analyzer.fault.${id}.symptom`,
    cause: `sim.analyzer.fault.${id}.cause`,
    action: `sim.analyzer.fault.${id}.action`,
  };
}

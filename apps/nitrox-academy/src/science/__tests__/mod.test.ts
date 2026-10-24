import { describe, expect, it } from 'vitest';
import { bestMix, bestMixExact, mod, modSteps } from '../mod';

/**
 * Reference values are the standard MOD formula as printed in recreational Nitrox training
 * materials, rounded down to the whole foot/metre, and independently re-derived by hand in
 * the comments. (Published agency tables may round further to table depths, e.g. NOAA lists
 * 130 fsw for NN32 at 1.6 ata where the formula gives 132.)
 */
describe('mod()', () => {
  it('matches the formula in feet (rounded down)', () => {
    // (1.4/0.32 − 1) × 33 = 111.375 → 111 fsw
    expect(mod(0.32, 1.4, { unit: 'ft' })).toBe(111);
    // (1.6/0.32 − 1) × 33 = 132 fsw
    expect(mod(0.32, 1.6, { unit: 'ft' })).toBe(132);
    // (1.4/0.36 − 1) × 33 = 95.33 → 95 fsw
    expect(mod(0.36, 1.4, { unit: 'ft' })).toBe(95);
    // (1.6/0.36 − 1) × 33 = 113.67 → 113 fsw
    expect(mod(0.36, 1.6, { unit: 'ft' })).toBe(113);
    // (1.4/0.40 − 1) × 33 = 82.5 → 82 fsw
    expect(mod(0.4, 1.4, { unit: 'ft' })).toBe(82);
    // 100% O2 at 1.6: (1.6/1 − 1) × 33 = 19.8 → 19 fsw
    expect(mod(1.0, 1.6, { unit: 'ft' })).toBe(19);
  });

  it('matches metric textbook values (rounded down)', () => {
    expect(mod(0.32, 1.4)).toBe(33); // 33.75 m
    expect(mod(0.32, 1.6)).toBe(40); // exactly 40 m
    expect(mod(0.36, 1.4)).toBe(28); // 28.89 m
    expect(mod(0.36, 1.6)).toBe(34); // 34.44 m
    expect(mod(0.21, 1.4)).toBe(56); // 56.67 m
    expect(mod(0.21, 1.6)).toBe(66); // 66.19 m
    expect(mod(0.5, 1.4)).toBe(18); // exactly 18 m
    expect(mod(1.0, 1.6)).toBe(6); // exactly 6 m
    expect(mod(1.0, 1.4)).toBe(4); // exactly 4 m
  });

  it('returns exact values when asked', () => {
    expect(mod(0.32, 1.4, { rounding: 'exact' })).toBeCloseTo(33.75, 6);
    expect(mod(0.36, 1.4, { rounding: 'exact' })).toBeCloseTo(28.888888, 5);
  });

  it('is monotonic: richer mixes have shallower MODs; higher limits deeper MODs', () => {
    for (let pct = 22; pct < 100; pct++) {
      expect(mod(pct / 100, 1.4, { rounding: 'exact' })).toBeGreaterThan(mod((pct + 1) / 100, 1.4, { rounding: 'exact' }));
    }
    expect(mod(0.32, 1.6)).toBeGreaterThan(mod(0.32, 1.4));
  });

  it('does not suffer floating-point under-rounding at exact boundaries', () => {
    expect(mod(0.32, 1.6)).toBe(40);
    expect(mod(0.4, 1.6)).toBe(30); // (1.6/0.4 − 1) × 10 = 30 exactly
    expect(mod(0.28, 1.4)).toBe(40); // (1.4/0.28 − 1) × 10 = 40
  });

  it('clamps to the surface when the limit is below surface PPO2', () => {
    // Pure O2 with a 0.5 limit would be "negative depth": report 0.
    expect(mod(1.0, 0.5)).toBe(0);
  });

  it('rejects impossible inputs', () => {
    expect(() => mod(0, 1.4)).toThrow(RangeError);
    expect(() => mod(1.2, 1.4)).toThrow(RangeError);
    expect(() => mod(0.32, Number.NaN)).toThrow(TypeError);
    expect(() => mod(0.32, 5)).toThrow(RangeError);
  });
});

describe('modSteps()', () => {
  it('exposes every intermediate value of the worked calculation', () => {
    const s = modSteps(0.32, 1.4, 'm');
    expect(s.pAbsAtLimit).toBeCloseTo(4.375, 6);
    expect(s.gaugeAtLimit).toBeCloseTo(3.375, 6);
    expect(s.exactDepth).toBeCloseTo(33.75, 6);
    expect(s.mod).toBe(33);
  });
});

describe('bestMix()', () => {
  it('returns the richest whole-percent mix that respects the limit', () => {
    expect(bestMix(30, 1.4)).toBe(0.35); // 1.4 / 4.0 = 0.35
    expect(bestMix(33, 1.4)).toBe(0.32); // 1.4 / 4.3 = 0.3256 → 32%
    expect(bestMix(40, 1.4)).toBe(0.28); // 1.4 / 5.0 = 0.28
    expect(bestMix(18, 1.4)).toBe(0.5); // 1.4 / 2.8 = 0.5
    expect(bestMix(100, 1.4, 'ft')).toBe(0.34); // 1.4 / 4.03 = 0.3474 → 34%
    expect(bestMix(0, 1.4)).toBe(1.0); // capped at pure oxygen
  });

  it('best mix at its own MOD reaches the limit but never exceeds it', () => {
    for (let depth = 10; depth <= 60; depth += 1) {
      const fo2 = bestMix(depth, 1.4);
      const pAbs = depth / 10 + 1;
      expect(fo2 * pAbs).toBeLessThanOrEqual(1.4 + 1e-9);
      expect(bestMixExact(depth, 1.4) * pAbs).toBeCloseTo(1.4, 9);
    }
  });
});

import { describe, expect, it } from 'vitest';
import { absolutePressure, convertDepth, depthForAbsolutePressure, gaugePressure } from '../pressure';
import { AIR, eanx, gasAtDepth, mixName, nitrox, partialPressure, ppn2AtDepth, ppo2AtDepth } from '../gas';
import { ead, eadRounded } from '../ead';

describe('pressure', () => {
  it('uses the 10 msw / 33 fsw per atmosphere teaching conventions', () => {
    expect(absolutePressure(0)).toBe(1);
    expect(absolutePressure(10)).toBe(2);
    expect(absolutePressure(30)).toBe(4);
    expect(absolutePressure(33, 'ft')).toBe(2);
    expect(absolutePressure(99, 'ft')).toBe(4);
    expect(gaugePressure(25)).toBeCloseTo(2.5, 9);
  });
  it('inverts correctly', () => {
    expect(depthForAbsolutePressure(4.375)).toBeCloseTo(33.75, 9);
    expect(depthForAbsolutePressure(1)).toBe(0);
    expect(() => depthForAbsolutePressure(0.5)).toThrow(RangeError);
  });
  it('converts depth units with the exact factor', () => {
    expect(convertDepth(30, 'm', 'ft')).toBeCloseTo(98.425, 3);
    expect(convertDepth(100, 'ft', 'm')).toBeCloseTo(30.48, 9);
  });
});

describe('gas mixes and Dalton\'s law', () => {
  it('builds normalized mixes', () => {
    expect(nitrox(0.32)).toEqual({ fo2: 0.32, fn2: 0.68 });
    expect(eanx(36)).toEqual({ fo2: 0.36, fn2: 0.64 });
    expect(AIR.fo2 + AIR.fn2).toBeCloseTo(1, 9);
  });
  it('names mixes like a cylinder label', () => {
    expect(mixName(0.21)).toBe('Air');
    expect(mixName(0.32)).toBe('EAN32');
    expect(mixName(eanx(36))).toBe('EAN36');
    expect(mixName(1)).toBe('O2');
  });
  it('computes partial pressures at depth (textbook examples)', () => {
    expect(partialPressure(0.32, 4)).toBeCloseTo(1.28, 9);
    expect(ppo2AtDepth(0.32, 30)).toBeCloseTo(1.28, 9); // EAN32 at 30 m
    expect(ppo2AtDepth(0.32, 40)).toBeCloseTo(1.6, 9); // EAN32 at its 1.6 MOD
    expect(ppo2AtDepth(0.21, 0)).toBeCloseTo(0.21, 9);
    expect(ppo2AtDepth(0.21, 30)).toBeCloseTo(0.84, 9);
    expect(ppn2AtDepth(0.21, 30)).toBeCloseTo(3.16, 9);
    expect(ppn2AtDepth(0.36, 30)).toBeCloseTo(2.56, 9);
    expect(ppo2AtDepth(0.36, 99, 'ft')).toBeCloseTo(1.44, 9);
  });
  it('partial pressures always sum to the ambient pressure', () => {
    for (const fo2 of [0.21, 0.28, 0.32, 0.36, 0.4, 0.5]) {
      for (let d = 0; d <= 60; d += 5) {
        const g = gasAtDepth(fo2, d);
        expect(g.ppo2 + g.ppn2).toBeCloseTo(g.pAbs, 9);
      }
    }
  });
});

describe('equivalent air depth', () => {
  it('matches worked textbook examples', () => {
    expect(ead(0.32, 30)).toBeCloseTo(24.43, 2); // (0.68 × 40 / 0.79) − 10
    expect(ead(0.36, 30)).toBeCloseTo(22.41, 2); // (0.64 × 40 / 0.79) − 10
    expect(ead(0.32, 100, 'ft')).toBeCloseTo(81.48, 2); // (0.68 × 133 / 0.79) − 33
    expect(ead(0.36, 25)).toBeCloseTo(18.35, 2);
  });
  it('air has an EAD equal to the actual depth', () => {
    for (let d = 0; d <= 60; d += 10) expect(ead(0.21, d)).toBeCloseTo(d, 9);
  });
  it('rounds up for conservative air-table lookup and never goes negative', () => {
    expect(eadRounded(0.32, 30)).toBe(25);
    expect(eadRounded(0.36, 30)).toBe(23);
    expect(eadRounded(0.4, 5)).toBe(2); // (0.6 × 15 / 0.79) − 10 = 1.39 → 2
    expect(eadRounded(1.0, 5)).toBe(0); // pure O2: no nitrogen
  });
});

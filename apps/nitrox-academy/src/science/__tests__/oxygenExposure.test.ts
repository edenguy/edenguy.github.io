import { describe, expect, it } from 'vitest';
import { cnsPercent, noaaDailyLimit, noaaSingleExposureLimit, otu, totalExposure } from '../oxygenExposure';
import { NOAA_OXYGEN_EXPOSURE_LIMITS } from '../limits';

describe('NOAA oxygen exposure table', () => {
  it('contains the published 2001 NOAA single and daily limits', () => {
    const byPpo2 = Object.fromEntries(NOAA_OXYGEN_EXPOSURE_LIMITS.map((r) => [r.ppo2, r]));
    expect(byPpo2[1.6]).toMatchObject({ singleExposureMin: 45, dailyMin: 150 });
    expect(byPpo2[1.5]).toMatchObject({ singleExposureMin: 120, dailyMin: 180 });
    expect(byPpo2[1.4]).toMatchObject({ singleExposureMin: 150, dailyMin: 180 });
    expect(byPpo2[1.3]).toMatchObject({ singleExposureMin: 180, dailyMin: 210 });
    expect(byPpo2[1.2]).toMatchObject({ singleExposureMin: 210, dailyMin: 240 });
    expect(byPpo2[1.0]).toMatchObject({ singleExposureMin: 300, dailyMin: 300 });
    expect(byPpo2[0.6]).toMatchObject({ singleExposureMin: 720, dailyMin: 720 });
  });
  it('looks up conservatively (rounds PPO2 up to the next table row)', () => {
    expect(noaaSingleExposureLimit(1.4)).toBe(150);
    expect(noaaSingleExposureLimit(1.41)).toBe(120); // between 1.4 and 1.5 → use 1.5 row
    expect(noaaSingleExposureLimit(1.28)).toBe(180); // EAN32 at 30 m → 1.3 row
    expect(noaaSingleExposureLimit(0.21)).toBe(Infinity);
    expect(noaaSingleExposureLimit(1.7)).toBeNull();
    expect(noaaDailyLimit(1.4)).toBe(180);
  });
});

describe('cnsPercent()', () => {
  it('computes the oxygen clock as minutes / single-exposure limit', () => {
    expect(cnsPercent(1.4, 150)).toBeCloseTo(100, 9);
    expect(cnsPercent(1.4, 45)).toBeCloseTo(30, 9);
    expect(cnsPercent(1.6, 45)).toBeCloseTo(100, 9);
    expect(cnsPercent(1.28, 60)).toBeCloseTo(33.33, 2);
    expect(cnsPercent(0.4, 600)).toBe(0);
    expect(cnsPercent(1.8, 10)).toBeNull();
  });
});

describe('otu()', () => {
  it('equals one unit per minute at PO2 = 1.0 ata', () => {
    expect(otu(1.0, 1)).toBeCloseTo(1, 9);
    expect(otu(1.0, 60)).toBeCloseTo(60, 9);
  });
  it('is zero at or below 0.5 ata', () => {
    expect(otu(0.5, 100)).toBe(0);
    expect(otu(0.21, 100)).toBe(0);
  });
  it('matches hand-computed values', () => {
    // 1.4 ata: (0.9/0.5)^0.83 = 1.8^0.83 ≈ 1.6288 per minute
    expect(otu(1.4, 100)).toBeCloseTo(162.88, 1);
    // 1.6 ata: (1.1/0.5)^0.83 = 2.2^0.83 ≈ 1.9237 per minute
    expect(otu(1.6, 45)).toBeCloseTo(86.57, 1);
    // 1.28 ata (EAN32 at 30 m): (0.78/0.5)^0.83 = 1.56^0.83 ≈ 1.4466
    expect(otu(1.28, 60)).toBeCloseTo(86.8, 0);
  });
});

describe('totalExposure()', () => {
  it('sums segments and flags out-of-table PPO2', () => {
    const t = totalExposure([
      { ppo2: 1.28, minutes: 30 },
      { ppo2: 1.4, minutes: 30 },
    ]);
    expect(t.cnsPercent).toBeCloseTo(30 / 180 * 100 + 30 / 150 * 100, 6);
    expect(t.otu).toBeCloseTo(otu(1.28, 30) + otu(1.4, 30), 9);
    expect(totalExposure([{ ppo2: 1.9, minutes: 1 }]).cnsPercent).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { cnsAfterInterval, diveExposure, repetitiveExposure } from '../cns';

describe('cnsAfterInterval()', () => {
  it('halves the value after one half-time (90 min) and quarters it after two (180 min)', () => {
    expect(cnsAfterInterval(40, 90)).toBeCloseTo(20, 9);
    expect(cnsAfterInterval(40, 180)).toBeCloseTo(10, 9);
  });
  it('is the identity at 0 minutes', () => {
    expect(cnsAfterInterval(37.5, 0)).toBeCloseTo(37.5, 9);
  });
  it('never goes below 0 and decays towards 0 for long intervals', () => {
    expect(cnsAfterInterval(100, 900)).toBeGreaterThanOrEqual(0);
    expect(cnsAfterInterval(100, 900)).toBeLessThan(0.1);
  });
  it('rejects invalid inputs', () => {
    expect(() => cnsAfterInterval(Number.NaN, 90)).toThrow(TypeError);
    expect(() => cnsAfterInterval(-1, 90)).toThrow(RangeError);
    expect(() => cnsAfterInterval(40, -1)).toThrow(RangeError);
  });
});

describe('diveExposure()', () => {
  it('computes CNS% and OTU from depth/time segments via gasAtDepth + totalExposure', () => {
    // EAN28 at 40 m: PPO2 = 0.28 × (40/10 + 1) = 1.4 ata. NOAA 1.4 row single-exposure limit
    // is 150 min, so a 30-minute segment is 30/150 × 100 = 20 % CNS (hand-derived).
    const d = diveExposure({ fo2: 0.28, segments: [{ depth: 40, minutes: 30 }] });
    expect(d.cnsPercent).toBeCloseTo(20, 6);
    expect(d.maxPpo2).toBeCloseTo(1.4, 9);
    expect(d.maxDepth).toBe(40);
    expect(d.segments).toHaveLength(1);
    expect(d.segments[0]!.ppo2).toBeCloseTo(1.4, 9);
    expect(d.otu).toBeGreaterThan(0);
  });

  it('sums multiple segments', () => {
    // Two 15-minute segments at the same PPO2 sum to the same CNS% as one 30-minute segment.
    const whole = diveExposure({ fo2: 0.28, segments: [{ depth: 40, minutes: 30 }] });
    const split = diveExposure({ fo2: 0.28, segments: [{ depth: 40, minutes: 15 }, { depth: 40, minutes: 15 }] });
    expect(split.cnsPercent).toBeCloseTo(whole.cnsPercent!, 9);
    expect(split.otu).toBeCloseTo(whole.otu, 9);
  });

  it('is null when any segment exceeds the NOAA table (PPO2 > 1.6 ata)', () => {
    // EAN34 at 40 m: PPO2 = 0.34 × 5 = 1.7 ata — beyond the table.
    const d = diveExposure({ fo2: 0.34, segments: [{ depth: 40, minutes: 10 }] });
    expect(d.cnsPercent).toBeNull();
    // OTU still accumulates even when CNS is out of table range.
    expect(d.otu).toBeGreaterThan(0);
  });

  it('handles an empty segment list', () => {
    const d = diveExposure({ fo2: 0.32, segments: [] });
    expect(d).toEqual({ cnsPercent: 0, otu: 0, maxPpo2: 0, maxDepth: 0, segments: [] });
  });

  it('rejects an invalid mix', () => {
    expect(() => diveExposure({ fo2: 1.5, segments: [{ depth: 10, minutes: 5 }] })).toThrow(RangeError);
  });
});

describe('repetitiveExposure()', () => {
  it('matches the hand-derived two-dive example: 10 % + 20 % = 30 %', () => {
    // Dive 1: EAN28 at 40 m for 30 min → 20 % CNS (as above).
    // After a 90-minute interval (one half-time) that decays to 10 %.
    // Dive 2: the same profile adds another 20 %, for a running total of 30 %.
    const dive = { fo2: 0.28, segments: [{ depth: 40, minutes: 30 }] };
    const r = repetitiveExposure([dive, dive], [90]);
    expect(r.cumulativeCns[0]).toBeCloseTo(20, 6);
    expect(r.cumulativeCns[1]).toBeCloseTo(30, 6);
    expect(r.perDive).toHaveLength(2);
    expect(r.cumulativeOtu).toBeCloseTo(r.perDive[0]!.otu + r.perDive[1]!.otu, 9);
  });

  it('propagates null once any dive is out of NOAA table range', () => {
    const over = { fo2: 0.34, segments: [{ depth: 40, minutes: 10 } /* 1.7 ata */] };
    const normal = { fo2: 0.28, segments: [{ depth: 40, minutes: 30 }] };
    const r = repetitiveExposure([over, normal], [60]);
    expect(r.cumulativeCns[0]).toBeNull();
    expect(r.cumulativeCns[1]).toBeNull();
  });

  it('handles a single dive (no interval needed)', () => {
    const dive = { fo2: 0.32, segments: [{ depth: 20, minutes: 40 }] };
    const r = repetitiveExposure([dive], []);
    expect(r.cumulativeCns).toHaveLength(1);
    expect(r.cumulativeCns[0]).toBe(r.perDive[0]!.cnsPercent);
  });
});

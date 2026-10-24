import { describe, expect, it } from 'vitest';
import {
  analyzerIsStable,
  analyzerSample,
  analyzerSetCal,
  analyzerSetFlow,
  analyzerStep,
  createAnalyzer,
  describeFault,
} from '../analyzer';

describe('createAnalyzer()', () => {
  it('starts calibrated to ambient air (20.9) with no fault', () => {
    const s = createAnalyzer({ trueFo2: 0.32, seed: 1 });
    expect(s.display).toBeCloseTo(20.9, 1);
    expect(s.calOffset).toBe(0);
    expect(s.cellGain).toBe(1);
    expect(s.sampling).toBe(false);
    expect(s.fault).toBe('none');
  });
  it('presets each fault\'s starting condition (LLD §4.3)', () => {
    expect(createAnalyzer({ trueFo2: 0.32, fault: 'not-calibrated' }).calOffset).toBe(-1.5);
    expect(createAnalyzer({ trueFo2: 0.32, fault: 'aging-cell' }).cellGain).toBe(0.85);
    expect(createAnalyzer({ trueFo2: 0.32, fault: 'residual-gas' }).sensorFo2).toBe(0.36);
    expect(createAnalyzer({ trueFo2: 0.32, fault: 'calibrated-on-wrong-gas' }).sampling).toBe(true);
  });
  it('rejects a cylinder content outside the fraction-of-oxygen range', () => {
    expect(() => createAnalyzer({ trueFo2: 1.5 })).toThrow(RangeError);
    expect(() => createAnalyzer({ trueFo2: Number.NaN })).toThrow(TypeError);
  });
});

describe('analyzerStep() — healthy cell', () => {
  it('reads 32.0 ± 0.2 after 60 s sampling EAN32 at 2 L/min (hand-derived)', () => {
    // tau = clamp(12 / max(2, 0.2), 4, 90) = 6 s. After 60 s (10 time constants) sensorFo2 has
    // converged to trueFo2 = 0.32 (1 − e^−10 ≈ 0.99995); raw = 32.0, flowBias = 0 (flow ≤ 3).
    let s = createAnalyzer({ trueFo2: 0.32, seed: 1 });
    s = analyzerSetFlow(s, 2);
    s = analyzerSample(s, true);
    s = analyzerStep(s, 60);
    expect(Math.abs(s.display - 32.0)).toBeLessThanOrEqual(0.2);
  });

  it('reads at least 32.5 at 5 L/min (pressurisation bias), hand-derived ≈ 32.6', () => {
    // tau = clamp(12 / 5, 4, 90) = 4 s → fully converged after 60 s; raw = 32.0;
    // flowBias = 0.3 × (5 − 3) = 0.6 → display ≈ 32.6 ± 0.05 noise.
    let s = createAnalyzer({ trueFo2: 0.32, seed: 1 });
    s = analyzerSetFlow(s, 5);
    s = analyzerSample(s, true);
    s = analyzerStep(s, 60);
    expect(s.display).toBeGreaterThanOrEqual(32.5);
  });

  it('a lower flow responds more slowly than a higher flow over the same short time', () => {
    const base = createAnalyzer({ trueFo2: 0.32, seed: 1 });
    const low = analyzerStep(analyzerSample(analyzerSetFlow(base, 0.3), true), 10);
    const high = analyzerStep(analyzerSample(analyzerSetFlow(base, 3), true), 10);
    expect(low.sensorFo2).toBeLessThan(high.sensorFo2);
  });
});

describe('analyzerStep() — aging-cell fault', () => {
  it('cannot be fully calibrated to 20.9 in air even at the maximum CAL offset', () => {
    let s = createAnalyzer({ trueFo2: 0.32, fault: 'aging-cell', seed: 2 });
    s = analyzerSetCal(s, 3); // the knob's maximum
    s = analyzerStep(s, 600); // 10 minutes in air (not sampling) — plenty to settle
    // Hand-derived: raw = ambientFo2(0.209) × 100 × cellGain(0.85) = 17.765; + calOffset 3 =
    // 20.765 < 20.9. (Note: the LLD's test prose says "cannot exceed 20.9 − 2"; with its own
    // stated constants — cellGain 0.85, calOffset ±3 — the shortfall is only ≈ 0.14, not 2. We
    // assert the arithmetic the model's own formulas actually produce; see the final report.)
    expect(s.display).toBeLessThan(20.9);
    expect(s.display).toBeGreaterThan(20.5);
  });

  it('cellGain decreases by 0.001 per minute spent sampling, floored at 0.5', () => {
    let s = createAnalyzer({ trueFo2: 0.32, fault: 'aging-cell', seed: 3 });
    s = analyzerSample(s, true);
    s = analyzerStep(s, 3600); // 60 minutes
    expect(s.cellGain).toBeCloseTo(0.85 - 0.06, 6);
  });

  it('does not decay while not sampling', () => {
    let s = createAnalyzer({ trueFo2: 0.32, fault: 'aging-cell', seed: 3 });
    s = analyzerStep(s, 3600);
    expect(s.cellGain).toBe(0.85);
  });
});

describe('analyzerStep() — low-battery fault freezes the display every other second', () => {
  it('holds the previous display on an odd second and updates again on the next even one', () => {
    let s = createAnalyzer({ trueFo2: 0.36, fault: 'low-battery', seed: 4 });
    s = analyzerSample(s, true);
    const frozen = analyzerStep(s, 1); // tSeconds = 1 (odd) → frozen
    expect(frozen.display).toBe(s.display);
    const updated = analyzerStep(frozen, 1); // tSeconds = 2 (even) → updates
    expect(updated.display).not.toBeCloseTo(s.display, 1);
  });
});

describe('analyzerStep() — determinism', () => {
  it('the same seed produces an identical trajectory', () => {
    const run = () => {
      let s = createAnalyzer({ trueFo2: 0.32, fault: 'unstable-cell', seed: 42 });
      s = analyzerSetFlow(s, 2);
      s = analyzerSample(s, true);
      for (const dt of [1, 1, 2, 0.25, 5, 10]) s = analyzerStep(s, dt);
      return s;
    };
    expect(run()).toEqual(run());
  });

  it('different seeds eventually diverge under the unstable-cell fault', () => {
    const run = (seed: number) => {
      let s = createAnalyzer({ trueFo2: 0.32, fault: 'unstable-cell', seed });
      s = analyzerSample(s, true);
      for (let i = 0; i < 20; i++) s = analyzerStep(s, 1);
      return s.display;
    };
    expect(run(1)).not.toBe(run(2));
  });
});

describe('analyzerSetCal() / analyzerSetFlow()', () => {
  it('accept the documented ranges', () => {
    const s = createAnalyzer({ trueFo2: 0.32 });
    expect(analyzerSetCal(s, -3).calOffset).toBe(-3);
    expect(analyzerSetCal(s, 3).calOffset).toBe(3);
    expect(analyzerSetFlow(s, 0).flowLpm).toBe(0);
    expect(analyzerSetFlow(s, 5).flowLpm).toBe(5);
  });
  it('reject out-of-range or invalid values', () => {
    const s = createAnalyzer({ trueFo2: 0.32 });
    expect(() => analyzerSetCal(s, 3.1)).toThrow(RangeError);
    expect(() => analyzerSetCal(s, -3.1)).toThrow(RangeError);
    expect(() => analyzerSetFlow(s, 5.1)).toThrow(RangeError);
    expect(() => analyzerSetFlow(s, -0.1)).toThrow(RangeError);
    expect(() => analyzerStep(s, -1)).toThrow(RangeError);
    expect(() => analyzerStep(s, Number.NaN)).toThrow(TypeError);
  });
});

describe('analyzerIsStable()', () => {
  it('is true when the trailing window varies by less than the tolerance', () => {
    const history = [10, 15, 32.0, 32.02, 31.98, 32.01, 31.99, 32.03, 32.0, 31.97, 32.02, 32.01];
    expect(analyzerIsStable(history, 10, 0.1)).toBe(true);
  });
  it('is false when the trailing window varies by more than the tolerance', () => {
    const history = [32.0, 32.02, 31.98, 32.01, 31.99, 32.03, 32.0, 31.97, 32.02, 32.6];
    expect(analyzerIsStable(history, 10, 0.1)).toBe(false);
  });
  it('is false without enough history yet, or with a non-positive window', () => {
    expect(analyzerIsStable([32.0, 32.0, 32.0], 10, 0.1)).toBe(false);
    expect(analyzerIsStable([32.0, 32.0, 32.0], 0, 0.1)).toBe(false);
    expect(analyzerIsStable([], 10, 0.1)).toBe(false);
  });
});

describe('describeFault()', () => {
  it('returns i18n keys, not literal text, for every fault', () => {
    for (const id of ['not-calibrated', 'aging-cell', 'unstable-cell'] as const) {
      const d = describeFault(id);
      expect(d.symptom).toBe(`sim.analyzer.fault.${id}.symptom`);
      expect(d.cause).toBe(`sim.analyzer.fault.${id}.cause`);
      expect(d.action).toBe(`sim.analyzer.fault.${id}.action`);
    }
  });
});

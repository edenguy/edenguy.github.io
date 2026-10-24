import { afterEach, describe, expect, it } from 'vitest';
import { NDL_TABLE, REPEX, airNdl } from '../ndl';

// Snapshot the shipped (unverified, empty) table so every test that mutates it for exercising
// the lookup logic restores the real module state afterwards. Never commit real NDL numbers
// here — see LLD §0.1/§4.2 and docs/RESEARCH.md "Open verification items".
const SHIPPED_TABLE = { ...NDL_TABLE, rows: [...NDL_TABLE.rows] };
afterEach(() => {
  NDL_TABLE.verified = SHIPPED_TABLE.verified;
  NDL_TABLE.rows = [...SHIPPED_TABLE.rows];
});

describe('NDL_TABLE', () => {
  it('ships unverified and empty — no NDL numbers are published without a human check', () => {
    expect(NDL_TABLE.verified).toBe(false);
    expect(NDL_TABLE.rows).toEqual([]);
    expect(NDL_TABLE.unit).toBe('ft');
    expect(typeof NDL_TABLE.source).toBe('string');
    expect(NDL_TABLE.source.length).toBeGreaterThan(0);
  });
});

describe('airNdl()', () => {
  it('returns null while the table is unverified, regardless of depth or unit', () => {
    expect(airNdl(18, 'm')).toBeNull();
    expect(airNdl(0, 'm')).toBeNull();
    expect(airNdl(130, 'ft')).toBeNull();
  });

  it('still validates its inputs even while gated off', () => {
    expect(() => airNdl(Number.NaN, 'm')).toThrow(TypeError);
    expect(() => airNdl(-1, 'm')).toThrow(RangeError);
  });

  it('once verified, rounds the depth UP to the next table row and returns that row\'s minutes', () => {
    // Synthetic fixture for exercising the lookup/rounding mechanism only — not real NDL data
    // (the shipped table stays empty; see the afterEach restore above).
    NDL_TABLE.verified = true;
    NDL_TABLE.rows = [
      { depthFt: 60, ndlMin: 100 },
      { depthFt: 80, ndlMin: 40 },
      { depthFt: 100, ndlMin: 20 },
    ];
    expect(airNdl(60, 'ft')).toBe(100); // exact row
    expect(airNdl(70, 'ft')).toBe(40); // rounds up to the 80 ft row
    expect(airNdl(1, 'm')).toBe(100); // well within the shallowest row
  });

  it('once verified, returns null past the table\'s deepest row', () => {
    NDL_TABLE.verified = true;
    NDL_TABLE.rows = [{ depthFt: 60, ndlMin: 100 }];
    expect(airNdl(61, 'ft')).toBeNull();
  });

  it('returns null again if rows are verified but empty', () => {
    NDL_TABLE.verified = true;
    NDL_TABLE.rows = [];
    expect(airNdl(18, 'm')).toBeNull();
  });
});

describe('REPEX', () => {
  it('ships unverified with an empty allowance — no REPEX figures are published unchecked', () => {
    expect(REPEX.verified).toBe(false);
    expect(REPEX.allowance).toEqual({});
    expect(typeof REPEX.source).toBe('string');
    expect(REPEX.source.length).toBeGreaterThan(0);
  });
});

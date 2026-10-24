import type { DepthUnit } from './constants';
import { convertDepth } from './pressure';
import { assertFinite, assertRange } from './validate';

/**
 * No-decompression limit table, verification-gated.
 *
 * Per LLD §0.1 and §4.2: never invent a number shown to a learner. `verified` MUST stay
 * `false` (and `rows` MUST stay empty) until a human has checked every row against the
 * printed source named in `source`. The UI (`NdlCompare`, `DivePlanner`) hides any NDL value
 * entirely while `verified` is false; see docs/RESEARCH.md "Open verification items".
 */
export interface NdlTableRow {
  depthFt: number;
  ndlMin: number;
}

export interface NdlTable {
  /** Publisher and edition/table this will be transcribed from, once verified. */
  source: string;
  unit: 'ft';
  /** MUST stay false until a human has checked every row against the printed source. */
  verified: boolean;
  rows: NdlTableRow[];
}

export const NDL_TABLE: NdlTable = {
  source: 'US Navy Diving Manual Rev 7 (2016), Table 9-7, air no-decompression limits (not yet transcribed/verified)',
  unit: 'ft',
  verified: false,
  rows: [],
};

/**
 * Air no-decompression limit lookup (minutes) at a depth, rounding the depth UP to the next
 * row the table lists (the conservative direction for an NDL, mirroring how `eadRounded`
 * rounds EAD up for table lookup).
 *
 * Returns null while `NDL_TABLE.verified` is false (always true today — this app does not
 * publish NDL values), or when the depth is beyond the table's deepest row.
 */
export function airNdl(depth: number, unit: DepthUnit): number | null {
  assertFinite(depth, 'depth');
  assertRange(depth, 0, 1000, 'depth');
  if (!NDL_TABLE.verified || NDL_TABLE.rows.length === 0) return null;
  const depthFt = convertDepth(depth, unit, 'ft');
  let best: NdlTableRow | null = null;
  for (const row of NDL_TABLE.rows) {
    if (row.depthFt + 1e-9 >= depthFt && (best === null || row.depthFt < best.depthFt)) best = row;
  }
  return best ? best.ndlMin : null;
}

/**
 * REPEX (Hamilton et al. 1988) daily OTU allowances, verification-gated the same way as
 * `NDL_TABLE`. Day-1's 850 OTU figure is widely reproduced in secondary sources, but per
 * LLD §0.1/§4.2 this app still does not publish it until checked against the primary source;
 * `allowance` MUST stay empty until that happens. See docs/RESEARCH.md.
 */
export interface RepexTable {
  verified: boolean;
  source: string;
  /** Mission day (1, 2, 3, …) → allowed cumulative OTU for that day. */
  allowance: Record<number, number>;
}

export const REPEX: RepexTable = {
  verified: false,
  source: 'Hamilton et al. 1988, NOAA REPEX',
  allowance: {},
};

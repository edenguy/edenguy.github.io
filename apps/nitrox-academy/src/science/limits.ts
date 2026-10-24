/**
 * Planning limits and exposure tables with provenance.
 *
 * These are training-agency standards and published exposure tables, NOT physical
 * constants. The UI must always say where a limit comes from and that agencies differ.
 */

export interface PlanningLimit {
  /** Oxygen partial pressure in ata/bar. */
  ppo2: number;
  /** Stable identifier used by content and tests. */
  id: 'recreational-working' | 'contingency';
  /** Who publishes it and in what terms (plain English; UI translates separately). */
  provenance: string;
}

/**
 * The two PPO2 values that recreational Nitrox training almost universally teaches.
 *  - 1.4 ata: the maximum most recreational agencies (for example PADI, SDI and RAID,
 *    per their public course descriptions) teach for the working phase of a dive, informed
 *    by the NOAA exposure limits. NOAA's own published Nitrox MOD tables use 1.6 ata.
 *  - 1.6 ata: the commonly taught contingency / absolute ceiling (NOAA single-exposure
 *    limit at 1.6 is 45 minutes). Most agencies reserve it for short, low-exertion
 *    exposure such as a safety stop, or discourage it entirely for recreational divers.
 */
export const PPO2_LIMITS: readonly PlanningLimit[] = [
  {
    ppo2: 1.4,
    id: 'recreational-working',
    provenance:
      'Commonly taught maximum PPO2 for the working phase of a recreational dive (recreational training agencies and the NOAA Diving Manual).',
  },
  {
    ppo2: 1.6,
    id: 'contingency',
    provenance:
      'Commonly taught contingency ceiling; the NOAA single-exposure limit at 1.6 ata is 45 minutes. Many agencies discourage planning any recreational dive at 1.6.',
  },
] as const;

export const DEFAULT_PLANNING_PPO2 = 1.4;
export const CONTINGENCY_PPO2 = 1.6;

/**
 * NOAA oxygen exposure limits (NOAA Diving Manual, oxygen exposure limits table, 4th ed.
 * 2001 and unchanged in later editions; the table number is to be confirmed against a
 * printed copy, see docs/RESEARCH.md).
 * Columns: PO2 (ata), maximum single exposure (minutes), maximum per 24 hours (minutes).
 *
 * These are the basis of the "CNS oxygen clock" percentage used by recreational agencies
 * and dive computers. They are population limits for working divers; individual tolerance
 * varies, and the UI must say so.
 */
export interface NoaaExposureRow {
  ppo2: number;
  singleExposureMin: number;
  dailyMin: number;
}

export const NOAA_OXYGEN_EXPOSURE_LIMITS: readonly NoaaExposureRow[] = [
  { ppo2: 1.6, singleExposureMin: 45, dailyMin: 150 },
  { ppo2: 1.5, singleExposureMin: 120, dailyMin: 180 },
  { ppo2: 1.4, singleExposureMin: 150, dailyMin: 180 },
  { ppo2: 1.3, singleExposureMin: 180, dailyMin: 210 },
  { ppo2: 1.2, singleExposureMin: 210, dailyMin: 240 },
  { ppo2: 1.1, singleExposureMin: 240, dailyMin: 270 },
  { ppo2: 1.0, singleExposureMin: 300, dailyMin: 300 },
  { ppo2: 0.9, singleExposureMin: 360, dailyMin: 360 },
  { ppo2: 0.8, singleExposureMin: 450, dailyMin: 450 },
  { ppo2: 0.7, singleExposureMin: 570, dailyMin: 570 },
  { ppo2: 0.6, singleExposureMin: 720, dailyMin: 720 },
] as const;

/** Below this PPO2 the NOAA table assigns no CNS exposure. */
export const NOAA_CNS_THRESHOLD_PPO2 = 0.5;

/**
 * OTU (Oxygen Tolerance Unit, a.k.a. UPTD) model: Bardin & Lambertsen (1970) as used by the
 * NOAA REPEX procedures (Hamilton et al., 1988). One OTU equals one minute at PO2 1.0 ata.
 * Formula: OTU = t × ((PO2 − 0.5) / 0.5)^0.83 for PO2 > 0.5 ata.
 */
export const OTU_EXPONENT = 0.83;
export const OTU_THRESHOLD_PPO2 = 0.5;

/**
 * REPEX daily OTU allowances (Hamilton 1988), indexed by mission length in days.
 * Day 1 of a single-day exposure: 850 OTU. These are included for the exposure
 * explorer's reference lines only, never as a planning recommendation.
 */
export const REPEX_DAILY_OTU_ALLOWANCE: Record<number, number> = {
  1: 850,
  2: 700,
  3: 620,
  4: 525,
  5: 460,
  6: 420,
  7: 380,
  8: 350,
  9: 330,
  10: 310,
  11: 300,
};

/**
 * Status bands by percent of capacity. Project proposal, not an official RID standard.
 * Each threshold is the inclusive upper bound of its band.
 */
export const BAND_THRESHOLDS = {
  critical: 30,
  low: 50,
  normal: 80,
  high: 100,
} as const;

export const BANDS = ["critical", "low", "normal", "high", "over", "nodata"] as const;
export type Band = (typeof BANDS)[number];

export function bandOf(percent: number | null): Band {
  if (percent === null || !Number.isFinite(percent)) return "nodata";
  if (percent <= BAND_THRESHOLDS.critical) return "critical";
  if (percent <= BAND_THRESHOLDS.low) return "low";
  if (percent <= BAND_THRESHOLDS.normal) return "normal";
  if (percent <= BAND_THRESHOLDS.high) return "high";
  return "over";
}

export function emptyBandCounts(): Record<Band, number> {
  return { critical: 0, low: 0, normal: 0, high: 0, over: 0, nodata: 0 };
}

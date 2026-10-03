import { emptyBandCounts, type Band } from "./bands";
import type { Reservoir } from "./normalize";

export interface GroupStats {
  count: number;
  /** Reservoirs that reported a volume today. */
  reporting: number;
  /** Capacity of all reservoirs in the group. */
  storage: number;
  /** Capacity of reporting reservoirs only; the denominator of `percent`. */
  reportingStorage: number;
  volume: number;
  usable: number;
  /** Σ volume / Σ reportingStorage × 100, or null when nothing reported. */
  percent: number | null;
  bands: Record<Band, number>;
}

export interface RegionStats extends GroupStats {
  region: string;
}

const round = (n: number, digits: number) => {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};

export function summarize(reservoirs: Reservoir[]): GroupStats {
  const stats = {
    count: 0,
    reporting: 0,
    storage: 0,
    reportingStorage: 0,
    volume: 0,
    usable: 0,
    bands: emptyBandCounts(),
  };

  for (const r of reservoirs) {
    stats.count++;
    stats.storage += r.storage;
    stats.bands[r.band]++;
    if (r.volume !== null) {
      stats.reporting++;
      stats.reportingStorage += r.storage;
      stats.volume += r.volume;
      stats.usable += r.usable ?? 0;
    }
  }

  return {
    ...stats,
    storage: round(stats.storage, 3),
    reportingStorage: round(stats.reportingStorage, 3),
    volume: round(stats.volume, 3),
    usable: round(stats.usable, 3),
    percent:
      stats.reportingStorage > 0 ? round((stats.volume / stats.reportingStorage) * 100, 2) : null,
  };
}

/** Regions keep the order in which they first appear in the RID data. */
export function summarizeByRegion(reservoirs: Reservoir[]): RegionStats[] {
  const groups = new Map<string, Reservoir[]>();
  for (const r of reservoirs) {
    const list = groups.get(r.region);
    if (list) list.push(r);
    else groups.set(r.region, [r]);
  }
  return [...groups].map(([region, list]) => ({ region, ...summarize(list) }));
}

import { ALL_BANDS } from "../config/bands";
import type { Band, Reservoir } from "../types";

export interface Filters {
  region: string | null;
  band: Band | null;
  q: string;
}

export const EMPTY_FILTERS: Filters = { region: null, band: null, q: "" };

/** Spacing- and case-insensitive key, so "อ่างเก็บน้ำ แม่สะลวม" matches "แม่สะลวม" and "RSV01" matches "rsv01". */
export function searchKey(s: string): string {
  return s.replace(/\s+/g, "").toLowerCase();
}

export function matchesQuery(r: Reservoir, q: string): boolean {
  const key = searchKey(q);
  if (!key) return true;
  return searchKey(r.name).includes(key) || r.id.toLowerCase().includes(key);
}

export function applyFilters(list: Reservoir[], f: Filters): Reservoir[] {
  return list.filter(
    (r) =>
      (f.region === null || r.region === f.region) &&
      (f.band === null || r.band === f.band) &&
      matchesQuery(r, f.q),
  );
}

/** Lowest `percent` first; reservoirs without data are left out. */
export function lowest(list: Reservoir[], n: number): Reservoir[] {
  return list
    .filter((r): r is Reservoir & { percent: number } => r.percent !== null)
    .sort((a, b) => a.percent - b.percent)
    .slice(0, n);
}

export function overCapacity(list: Reservoir[]): Reservoir[] {
  return list.filter((r) => r.band === "over").sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0));
}

export function parseFilters(search: string): Filters {
  const p = new URLSearchParams(search);
  const band = p.get("band");
  return {
    region: p.get("region") || null,
    band: band && (ALL_BANDS as string[]).includes(band) ? (band as Band) : null,
    q: p.get("q") ?? "",
  };
}

export function serializeFilters(f: Filters): string {
  const p = new URLSearchParams();
  if (f.region) p.set("region", f.region);
  if (f.band) p.set("band", f.band);
  if (f.q) p.set("q", f.q);
  const s = p.toString();
  return s ? `?${s}` : "";
}

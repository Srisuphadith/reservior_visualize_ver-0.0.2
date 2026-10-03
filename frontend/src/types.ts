// Mirrors the backend API contract (README §4.3).

export type Band = "critical" | "low" | "normal" | "high" | "over" | "nodata";

export interface Reservoir {
  id: string;
  name: string;
  displayName: string;
  region: string;
  storage: number;
  deadStorage: number;
  volume: number | null;
  percent: number | null;
  usable: number | null;
  inflow: number | null;
  outflow: number | null;
  netFlow: number | null;
  band: Band;
}

export interface GroupStats {
  count: number;
  reporting: number;
  storage: number;
  reportingStorage: number;
  volume: number;
  usable: number;
  percent: number | null;
  bands: Record<Band, number>;
}

export interface RegionStats extends GroupStats {
  region: string;
}

interface Meta {
  date: string;
  fetchedAt: string;
  stale: boolean;
  total: number;
}

export interface SummaryResponse extends Meta {
  national: GroupStats;
  regions: RegionStats[];
}

export interface ReservoirsResponse extends Meta {
  reservoirs: Reservoir[];
}

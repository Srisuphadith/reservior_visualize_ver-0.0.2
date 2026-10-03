import type { Band, GroupStats, RegionStats, Reservoir, ReservoirsResponse, SummaryResponse } from "../src/types";

export function reservoir(overrides: Partial<Reservoir> = {}): Reservoir {
  return {
    id: "rsv01",
    name: "อ่างเก็บน้ำห้วยแม่ออน",
    displayName: "อ่างเก็บน้ำห้วยแม่ออน",
    region: "ภาคเหนือ",
    storage: 4.53,
    deadStorage: 0.8,
    volume: 3.597,
    percent: 79.4,
    usable: 2.797,
    inflow: 0.035,
    outflow: 0.029,
    netFlow: 0.006,
    band: "normal",
    ...overrides,
  };
}

export const RESERVOIRS: Reservoir[] = [
  reservoir(),
  reservoir({
    id: "rsv531",
    name: "อ่างเก็บน้ำ แม่สะลวม",
    displayName: "อ่างเก็บน้ำแม่สะลวม",
    percent: 84.48,
    band: "high",
    inflow: null,
    netFlow: null,
  }),
  reservoir({
    id: "rsv545",
    name: "อ่างเก็บน้ำ บึงละหาน",
    displayName: "อ่างเก็บน้ำบึงละหาน",
    region: "ภาคตะวันออกเฉียงเหนือ",
    storage: 25,
    volume: 45.68,
    percent: 182.72,
    band: "over",
    outflow: null,
    netFlow: null,
  }),
  reservoir({
    id: "rsv74",
    name: "อ่างเก็บน้ำห้วยอีเลิศ",
    displayName: "อ่างเก็บน้ำห้วยอีเลิศ",
    region: "ภาคตะวันออกเฉียงเหนือ",
    percent: 12.3,
    band: "critical",
  }),
  reservoir({
    id: "rsv524",
    name: "อ่างเก็บน้ำห้วยพลาญเสือ (ตอนบน)",
    displayName: "อ่างเก็บน้ำห้วยพลาญเสือ (ตอนบน)",
    region: "ภาคตะวันออกเฉียงเหนือ",
    volume: null,
    percent: null,
    usable: null,
    band: "nodata",
  }),
];

const bands = (b: Partial<Record<Band, number>>) => ({ critical: 0, low: 0, normal: 0, high: 0, over: 0, nodata: 0, ...b });

const stats = (o: Partial<GroupStats>): GroupStats => ({
  count: 0,
  reporting: 0,
  storage: 0,
  reportingStorage: 0,
  volume: 0,
  usable: 0,
  percent: null,
  bands: bands({}),
  ...o,
});

export const REGIONS: RegionStats[] = [
  { region: "ภาคเหนือ", ...stats({ count: 2, reporting: 2, storage: 9.06, reportingStorage: 9.06, volume: 7.19, usable: 5.59, percent: 79.4, bands: bands({ normal: 1, high: 1 }) }) },
  { region: "ภาคตะวันออกเฉียงเหนือ", ...stats({ count: 3, reporting: 2, storage: 34.06, reportingStorage: 29.53, volume: 49.28, usable: 44.08, percent: 166.88, bands: bands({ critical: 1, over: 1, nodata: 1 }) }) },
];

export function summaryResponse(overrides: Partial<SummaryResponse> = {}): SummaryResponse {
  return {
    date: "2026-10-03",
    fetchedAt: "2026-10-03T08:15:00Z",
    stale: false,
    total: 5,
    national: stats({ count: 5, reporting: 4, storage: 43.12, reportingStorage: 38.59, volume: 56.47, usable: 49.67, percent: 146.33, bands: bands({ critical: 1, normal: 1, high: 1, over: 1, nodata: 1 }) }),
    regions: REGIONS,
    ...overrides,
  };
}

export function reservoirsResponse(overrides: Partial<ReservoirsResponse> = {}): ReservoirsResponse {
  return { date: "2026-10-03", fetchedAt: "2026-10-03T08:15:00Z", stale: false, total: 5, reservoirs: RESERVOIRS, ...overrides };
}

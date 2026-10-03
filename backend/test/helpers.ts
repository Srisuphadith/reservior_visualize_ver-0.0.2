import type { RidReservoir } from "../src/schema";

export const fixture = () => Bun.file(new URL("./fixtures/rid-2026-10-03.json", import.meta.url)).json();

export function rsv(overrides: Partial<RidReservoir> = {}): RidReservoir {
  return {
    id: "rsv-test",
    name: "อ่างเก็บน้ำทดสอบ",
    storage: 10,
    dead_storage: 1,
    volume: 5,
    percent_storage: 50,
    inflow: 0.1,
    outflow: 0.2,
    ...overrides,
  };
}

export function ridResponse(groups: Record<string, RidReservoir[]>, date = "2026-10-03") {
  return {
    document: "https://app.rid.go.th/reservoir/api/document/reservoir",
    date,
    total: Object.values(groups).flat().length,
    data: Object.entries(groups).map(([region, reservoir]) => ({ region, reservoir })),
  };
}

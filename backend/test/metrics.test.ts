import { describe, expect, test } from "bun:test";
import { summarize, summarizeByRegion } from "../src/metrics";
import { normalizeReservoir, normalizeResponse } from "../src/normalize";
import { fixture, rsv } from "./helpers";

const n = (o: Parameters<typeof rsv>[0], region = "R") => normalizeReservoir(rsv(o), region);

describe("summarize", () => {
  test("percent uses sums, not the average of percentages", () => {
    const s = summarize([
      n({ id: "small", storage: 1, volume: 1, percent_storage: 100, dead_storage: 0 }),
      n({ id: "big", storage: 99, volume: 9.9, percent_storage: 10, dead_storage: 0 }),
    ]);
    // Average of percentages would be 55; the correct weighted value is 10.9 / 100.
    expect(s.percent).toBe(10.9);
    expect(s.volume).toBe(10.9);
    expect(s.storage).toBe(100);
  });

  test("reservoirs without volume are counted but left out of percent", () => {
    const s = summarize([
      n({ id: "a", storage: 10, volume: 5, percent_storage: 50, dead_storage: 1 }),
      n({ id: "b", storage: 90, volume: null, percent_storage: 0 }),
    ]);
    expect(s).toMatchObject({ count: 2, reporting: 1, storage: 100, reportingStorage: 10, percent: 50, usable: 4 });
    expect(s.bands).toMatchObject({ low: 1, nodata: 1 });
  });

  test("empty and all-nodata groups have null percent", () => {
    expect(summarize([]).percent).toBeNull();
    expect(summarize([n({ volume: null })]).percent).toBeNull();
  });
});

describe("summarizeByRegion", () => {
  test("groups by region in first-seen order", () => {
    const regions = summarizeByRegion([
      n({ id: "1" }, "ภาคใต้"),
      n({ id: "2" }, "ภาคเหนือ"),
      n({ id: "3" }, "ภาคใต้"),
    ]);
    expect(regions.map((r) => [r.region, r.count])).toEqual([
      ["ภาคใต้", 2],
      ["ภาคเหนือ", 1],
    ]);
  });

  test("real fixture: region counts add up to the national count", async () => {
    const ds = normalizeResponse(await fixture(), () => {});
    const national = summarize(ds.reservoirs);
    const regions = summarizeByRegion(ds.reservoirs);
    expect(regions).toHaveLength(6);
    expect(regions.reduce((a, r) => a + r.count, 0)).toBe(national.count);
    const bandTotal = Object.values(national.bands).reduce((a, b) => a + b, 0);
    expect(bandTotal).toBe(461);
    expect(national.bands.nodata).toBe(6);
  });
});

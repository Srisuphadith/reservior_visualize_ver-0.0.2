import { describe, expect, test } from "bun:test";
import {
  cleanName,
  InvalidRidResponseError,
  normalizeReservoir,
  normalizeResponse,
} from "../src/normalize";
import { fixture, ridResponse, rsv } from "./helpers";

const silent = () => {};

describe("cleanName", () => {
  test("collapses whitespace and joins the อ่างเก็บน้ำ prefix", () => {
    expect(cleanName("อ่างเก็บน้ำ แม่สะลวม")).toBe("อ่างเก็บน้ำแม่สะลวม");
    expect(cleanName("  อ่างเก็บน้ำ   พระอาจารย์จื่อ  (ลำกระจวน) ")).toBe(
      "อ่างเก็บน้ำพระอาจารย์จื่อ (ลำกระจวน)",
    );
    expect(cleanName("อ่างเก็บน้ำแม่ตูบ")).toBe("อ่างเก็บน้ำแม่ตูบ");
  });
});

describe("normalizeReservoir", () => {
  test("maps fields and computes usable water and net flow", () => {
    const r = normalizeReservoir(rsv({ volume: 7, dead_storage: 2, inflow: 0.5, outflow: 0.2 }), "ภาคเหนือ");
    expect(r).toMatchObject({ region: "ภาคเหนือ", deadStorage: 2, usable: 5, netFlow: 0.3, band: "low" });
  });

  test("null inflow or outflow gives null netFlow, never treated as 0", () => {
    expect(normalizeReservoir(rsv({ inflow: null }), "x").netFlow).toBeNull();
    expect(normalizeReservoir(rsv({ outflow: null }), "x").netFlow).toBeNull();
    expect(normalizeReservoir(rsv({ inflow: null }), "x").inflow).toBeNull();
  });

  test("keeps values over 100% (no capping)", () => {
    const r = normalizeReservoir(rsv({ storage: 25, volume: 45.68, percent_storage: 182.72 }), "x");
    expect(r.percent).toBe(182.72);
    expect(r.band).toBe("over");
  });

  test("null volume is nodata even when RID reports percent_storage 0", () => {
    const r = normalizeReservoir(rsv({ volume: null, percent_storage: 0 }), "x");
    expect(r).toMatchObject({ percent: null, usable: null, band: "nodata" });
  });

  test("usable water is clamped at 0 when volume is below dead storage", () => {
    expect(normalizeReservoir(rsv({ volume: 0.5, dead_storage: 1 }), "x").usable).toBe(0);
  });

  test("computes percent when RID omits it, and guards zero storage", () => {
    expect(normalizeReservoir(rsv({ storage: 4, volume: 1, percent_storage: null }), "x").percent).toBe(25);
    expect(normalizeReservoir(rsv({ storage: 0, volume: 1, percent_storage: null }), "x").percent).toBeNull();
  });
});

describe("normalizeResponse", () => {
  test("throws on an invalid envelope", () => {
    expect(() => normalizeResponse({ foo: 1 }, silent)).toThrow(InvalidRidResponseError);
    expect(() => normalizeResponse(null, silent)).toThrow(InvalidRidResponseError);
    expect(() => normalizeResponse({ date: "03/10/2026", data: [] }, silent)).toThrow(
      InvalidRidResponseError,
    );
  });

  test("skips invalid and duplicate records instead of failing", () => {
    const logs: string[] = [];
    const raw = ridResponse({ ภาคเหนือ: [rsv({ id: "a" }), rsv({ id: "a" })] });
    (raw.data[0]!.reservoir as unknown[]).push({ id: "bad", storage: "x" });
    const ds = normalizeResponse(raw, (m) => logs.push(m));
    expect(ds.reservoirs.map((r) => r.id)).toEqual(["a"]);
    expect(ds.skipped).toBe(2);
    expect(logs).toHaveLength(2);
  });

  test("real fixture: every record is valid and edge cases are handled", async () => {
    const ds = normalizeResponse(await fixture(), silent);
    expect(ds.date).toBe("2026-10-03");
    expect(ds.total).toBe(461);
    expect(ds.skipped).toBe(0);
    expect(new Set(ds.reservoirs.map((r) => r.region)).size).toBe(6);

    const byId = new Map(ds.reservoirs.map((r) => [r.id, r]));
    expect(byId.get("rsv545")).toMatchObject({ percent: 182.72, band: "over", outflow: null, netFlow: null });
    expect(byId.get("rsv524")).toMatchObject({ volume: null, percent: null, band: "nodata" });
    expect(byId.get("rsv181")!.usable).toBe(0);

    // Duplicate names exist; ids stay unique.
    const ห้วยทราย = ds.reservoirs.filter((r) => r.displayName === "อ่างเก็บน้ำห้วยทราย");
    expect(ห้วยทราย.length).toBeGreaterThan(1);
    expect(new Set(ds.reservoirs.map((r) => r.id)).size).toBe(ds.reservoirs.length);
  });
});

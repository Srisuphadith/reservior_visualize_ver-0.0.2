import {
  applyFilters,
  EMPTY_FILTERS,
  lowest,
  matchesQuery,
  overCapacity,
  parseFilters,
  serializeFilters,
} from "../src/lib/filters";
import { RESERVOIRS, reservoir } from "./data";

const ids = (list: { id: string }[]) => list.map((r) => r.id);

describe("search", () => {
  test("ignores spacing in names", () => {
    const r = reservoir({ name: "อ่างเก็บน้ำ แม่สะลวม" });
    expect(matchesQuery(r, "แม่สะลวม")).toBe(true);
    expect(matchesQuery(r, "อ่างเก็บน้ำแม่สะลวม")).toBe(true);
    expect(matchesQuery(r, "แม่ สะ ลวม")).toBe(true);
  });

  test("matches id case-insensitively", () => {
    expect(matchesQuery(reservoir({ id: "rsv01" }), "RSV01")).toBe(true);
    expect(matchesQuery(reservoir({ id: "rsv01" }), "rsv99")).toBe(false);
  });

  test("blank query matches everything", () => {
    expect(matchesQuery(reservoir(), "  ")).toBe(true);
  });
});

describe("applyFilters", () => {
  test("combines region, band and query", () => {
    expect(ids(applyFilters(RESERVOIRS, EMPTY_FILTERS))).toHaveLength(5);
    expect(ids(applyFilters(RESERVOIRS, { ...EMPTY_FILTERS, region: "ภาคเหนือ" }))).toEqual(["rsv01", "rsv531"]);
    expect(ids(applyFilters(RESERVOIRS, { ...EMPTY_FILTERS, band: "over" }))).toEqual(["rsv545"]);
    expect(ids(applyFilters(RESERVOIRS, { region: "ภาคเหนือ", band: null, q: "สะลวม" }))).toEqual(["rsv531"]);
  });
});

describe("rankings", () => {
  test("lowest excludes reservoirs without data", () => {
    expect(ids(lowest(RESERVOIRS, 10))).toEqual(["rsv74", "rsv01", "rsv531", "rsv545"]);
    expect(ids(lowest(RESERVOIRS, 1))).toEqual(["rsv74"]);
  });

  test("overCapacity lists >100% highest first", () => {
    const list = [...RESERVOIRS, reservoir({ id: "x", percent: 101, band: "over" })];
    expect(ids(overCapacity(list))).toEqual(["rsv545", "x"]);
  });
});

describe("URL state", () => {
  test("round-trips filters", () => {
    const f = { region: "ภาคใต้", band: "critical" as const, q: "ห้วย" };
    expect(parseFilters(serializeFilters(f))).toEqual(f);
    expect(serializeFilters(EMPTY_FILTERS)).toBe("");
  });

  test("ignores unknown band values", () => {
    expect(parseFilters("?band=bogus").band).toBeNull();
  });
});

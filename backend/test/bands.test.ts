import { describe, expect, test } from "bun:test";
import { bandOf } from "../src/bands";

describe("bandOf", () => {
  test.each([
    [0, "critical"],
    [30, "critical"],
    [30.01, "low"],
    [50, "low"],
    [50.01, "normal"],
    [80, "normal"],
    [80.01, "high"],
    [100, "high"],
    [100.01, "over"],
    [182.72, "over"],
  ] as const)("%p%% → %s", (percent, band) => {
    expect(bandOf(percent)).toBe(band);
  });

  test("null and non-finite values are nodata", () => {
    expect(bandOf(null)).toBe("nodata");
    expect(bandOf(Number.NaN)).toBe("nodata");
  });
});

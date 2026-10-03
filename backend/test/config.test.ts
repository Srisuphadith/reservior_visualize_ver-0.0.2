import { describe, expect, test } from "bun:test";
import { loadConfig } from "../src/config";

describe("loadConfig", () => {
  test("uses defaults", () => {
    expect(loadConfig({})).toEqual({
      ridApiUrl: "https://app.rid.go.th/reservoir/api/reservoir/public",
      cacheTtlMs: 1_800_000,
      ridTimeoutMs: 10_000,
      port: 3000,
    });
  });

  test("reads overrides", () => {
    const c = loadConfig({ RID_API_URL: "http://mock/", CACHE_TTL_SECONDS: "60", RID_TIMEOUT_MS: "500", API_PORT: "4000" });
    expect(c).toEqual({ ridApiUrl: "http://mock/", cacheTtlMs: 60_000, ridTimeoutMs: 500, port: 4000 });
  });

  test("rejects invalid numbers", () => {
    expect(() => loadConfig({ CACHE_TTL_SECONDS: "abc" })).toThrow(/CACHE_TTL_SECONDS/);
    expect(() => loadConfig({ API_PORT: "-1" })).toThrow(/API_PORT/);
  });
});

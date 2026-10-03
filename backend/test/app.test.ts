import { describe, expect, test } from "bun:test";
import { createApp } from "../src/app";
import { normalizeResponse } from "../src/normalize";
import { NoDataError, type RidSource } from "../src/rid-client";
import { fixture } from "./helpers";

const fetchedAt = new Date("2026-10-03T08:15:00Z");

async function fixtureSource(stale = false): Promise<RidSource> {
  const data = normalizeResponse(await fixture(), () => {});
  return { get: async () => ({ data, fetchedAt, stale }) };
}

const failingSource: RidSource = {
  get: async () => {
    throw new NoDataError(new Error("down"));
  },
};

const call = (app: ReturnType<typeof createApp>, path: string) =>
  app.handle(new Request(`http://localhost${path}`));

describe("api routes", () => {
  test("GET /api/health", async () => {
    const res = await call(createApp(failingSource), "/api/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  test("GET /api/summary returns national and region metrics", async () => {
    const res = await call(createApp(await fixtureSource()), "/api/summary");
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body).toMatchObject({
      date: "2026-10-03",
      fetchedAt: "2026-10-03T08:15:00.000Z",
      stale: false,
      total: 461,
    });
    expect(body.national.count).toBe(461);
    expect(body.regions).toHaveLength(6);
    expect(body.regions[0].region).toBe("ภาคเหนือ");
  });

  test("GET /api/reservoirs returns all normalized reservoirs", async () => {
    const res = await call(createApp(await fixtureSource(true)), "/api/reservoirs");
    const body = (await res.json()) as any;
    expect(body.stale).toBe(true);
    expect(body.reservoirs).toHaveLength(461);
    expect(body.reservoirs[0]).toMatchObject({ id: "rsv01", region: "ภาคเหนือ", band: expect.any(String) });
  });

  test("returns 503 when no data is available", async () => {
    const app = createApp(failingSource);
    for (const path of ["/api/summary", "/api/reservoirs"]) {
      const res = await call(app, path);
      expect(res.status).toBe(503);
      expect(await res.json()).toEqual({ error: "RID data is currently unavailable" });
    }
  });
});

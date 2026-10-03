import { Elysia } from "elysia";
import { summarize, summarizeByRegion } from "./metrics";
import { NoDataError, type RidSource, type Snapshot } from "./rid-client";

const meta = (s: Snapshot) => ({
  date: s.data.date,
  fetchedAt: s.fetchedAt.toISOString(),
  stale: s.stale,
});

export function createApp(source: RidSource) {
  return new Elysia({ prefix: "/api" })
    .error({ NoDataError })
    .onError(({ code, set }) => {
      if (code === "NoDataError") {
        set.status = 503;
        return { error: "RID data is currently unavailable" };
      }
    })
    .get("/health", () => ({ status: "ok" }))
    .get("/summary", async () => {
      const s = await source.get();
      return {
        ...meta(s),
        total: s.data.total,
        national: summarize(s.data.reservoirs),
        regions: summarizeByRegion(s.data.reservoirs),
      };
    })
    .get("/reservoirs", async () => {
      const s = await source.get();
      return { ...meta(s), total: s.data.total, reservoirs: s.data.reservoirs };
    });
}

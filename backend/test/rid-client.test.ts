import { describe, expect, test } from "bun:test";
import { createRidSource, NoDataError } from "../src/rid-client";
import { ridResponse, rsv } from "./helpers";

const body = ridResponse({ ภาคเหนือ: [rsv({ id: "a" })] });

function setup(responses: Array<() => Response | Promise<Response>>) {
  let clock = 1_000_000;
  let calls = 0;
  const source = createRidSource({
    url: "http://rid.test/",
    ttlMs: 60_000,
    timeoutMs: 1000,
    now: () => clock,
    log: () => {},
    fetch: (async () => {
      const next = responses[Math.min(calls, responses.length - 1)]!;
      calls++;
      return next();
    }) as unknown as typeof fetch,
  });
  return {
    source,
    advance: (ms: number) => (clock += ms),
    calls: () => calls,
  };
}

const ok = () => Response.json(body);
const fail = () => new Response("boom", { status: 500 });

describe("createRidSource", () => {
  test("caches within the TTL", async () => {
    const t = setup([ok]);
    await t.source.get();
    t.advance(59_000);
    const s = await t.source.get();
    expect(t.calls()).toBe(1);
    expect(s.stale).toBe(false);
  });

  test("refetches after the TTL", async () => {
    const t = setup([ok]);
    await t.source.get();
    t.advance(60_001);
    await t.source.get();
    expect(t.calls()).toBe(2);
  });

  test("serves stale data when a refresh fails", async () => {
    const t = setup([ok, fail]);
    const first = await t.source.get();
    t.advance(60_001);
    const s = await t.source.get();
    expect(s.stale).toBe(true);
    expect(s.data.reservoirs[0]!.id).toBe("a");
    expect(s.fetchedAt).toEqual(first.fetchedAt);
  });

  test("serves stale data when RID returns an invalid body", async () => {
    const t = setup([ok, () => Response.json({ unexpected: true })]);
    await t.source.get();
    t.advance(60_001);
    expect((await t.source.get()).stale).toBe(true);
  });

  test("throws NoDataError when nothing is cached", async () => {
    const t = setup([fail]);
    await expect(t.source.get()).rejects.toBeInstanceOf(NoDataError);
  });

  test("throws NoDataError on network errors with an empty cache", async () => {
    const t = setup([() => Promise.reject(new TypeError("network down"))]);
    await expect(t.source.get()).rejects.toBeInstanceOf(NoDataError);
  });

  test("concurrent callers share one request", async () => {
    const t = setup([ok]);
    await Promise.all([t.source.get(), t.source.get(), t.source.get()]);
    expect(t.calls()).toBe(1);
  });
});

import { normalizeResponse, type Dataset } from "./normalize";

export interface Snapshot {
  data: Dataset;
  fetchedAt: Date;
  stale: boolean;
}

export class NoDataError extends Error {
  constructor(cause: unknown) {
    super("RID data is unavailable and nothing is cached", { cause });
    this.name = "NoDataError";
  }
}

export interface RidSourceOptions {
  url: string;
  ttlMs: number;
  timeoutMs: number;
  fetch?: typeof fetch;
  now?: () => number;
  log?: (msg: string) => void;
}

export interface RidSource {
  get(): Promise<Snapshot>;
}

/**
 * Fetches RID data with an in-memory TTL cache.
 * When a refresh fails, the last good data is served with `stale: true`.
 * Concurrent callers share a single in-flight request.
 */
export function createRidSource(options: RidSourceOptions): RidSource {
  const doFetch = options.fetch ?? fetch;
  const now = options.now ?? Date.now;
  const log = options.log ?? console.warn;

  let cached: { data: Dataset; fetchedAt: number } | null = null;
  let inFlight: Promise<Snapshot> | null = null;

  async function refresh(): Promise<Snapshot> {
    try {
      const res = await doFetch(options.url, {
        signal: AbortSignal.timeout(options.timeoutMs),
        headers: { accept: "application/json" },
      });
      if (!res.ok) throw new Error(`RID responded ${res.status}`);
      const data = normalizeResponse(await res.json(), log);
      cached = { data, fetchedAt: now() };
      return { data, fetchedAt: new Date(cached.fetchedAt), stale: false };
    } catch (err) {
      log(`RID fetch failed: ${err instanceof Error ? err.message : String(err)}`);
      if (cached) return { data: cached.data, fetchedAt: new Date(cached.fetchedAt), stale: true };
      throw new NoDataError(err);
    }
  }

  return {
    async get() {
      if (cached && now() - cached.fetchedAt < options.ttlMs) {
        return { data: cached.data, fetchedAt: new Date(cached.fetchedAt), stale: false };
      }
      inFlight ??= refresh().finally(() => {
        inFlight = null;
      });
      return inFlight;
    },
  };
}

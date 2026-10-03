export interface Config {
  ridApiUrl: string;
  cacheTtlMs: number;
  ridTimeoutMs: number;
  port: number;
}

function positiveInt(env: Record<string, string | undefined>, key: string, fallback: number) {
  const raw = env[key];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) throw new Error(`${key} must be a positive integer, got "${raw}"`);
  return n;
}

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  return {
    ridApiUrl: env.RID_API_URL || "https://app.rid.go.th/reservoir/api/reservoir/public",
    cacheTtlMs: positiveInt(env, "CACHE_TTL_SECONDS", 1800) * 1000,
    ridTimeoutMs: positiveInt(env, "RID_TIMEOUT_MS", 10000),
    port: positiveInt(env, "API_PORT", 3000),
  };
}

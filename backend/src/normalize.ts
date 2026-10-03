import { bandOf, type Band } from "./bands";
import { isRidReservoir, isRidResponse, type RidReservoir } from "./schema";

export interface Reservoir {
  id: string;
  name: string;
  displayName: string;
  region: string;
  storage: number;
  deadStorage: number;
  volume: number | null;
  percent: number | null;
  usable: number | null;
  inflow: number | null;
  outflow: number | null;
  netFlow: number | null;
  band: Band;
}

export interface Dataset {
  date: string;
  total: number;
  reservoirs: Reservoir[];
  skipped: number;
}

export class InvalidRidResponseError extends Error {
  constructor() {
    super("RID response does not match the expected schema");
    this.name = "InvalidRidResponseError";
  }
}

const round = (n: number, digits = 3) => {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};

/** Trim and collapse whitespace; also join "อ่างเก็บน้ำ" to the name ("อ่างเก็บน้ำ แม่สะลวม" → "อ่างเก็บน้ำแม่สะลวม"). */
export function cleanName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").replace(/^อ่างเก็บน้ำ\s+/, "อ่างเก็บน้ำ");
}

export function normalizeReservoir(raw: RidReservoir, region: string): Reservoir {
  // RID reports percent_storage = 0 when volume is missing; that is "no data", not "empty".
  const hasVolume = raw.volume !== null;
  const percent = !hasVolume
    ? null
    : raw.percent_storage ?? (raw.storage > 0 ? round((raw.volume! / raw.storage) * 100, 2) : null);
  const usable = hasVolume ? round(Math.max(raw.volume! - raw.dead_storage, 0)) : null;
  const netFlow =
    raw.inflow !== null && raw.outflow !== null ? round(raw.inflow - raw.outflow) : null;

  return {
    id: raw.id,
    name: raw.name,
    displayName: cleanName(raw.name),
    region,
    storage: raw.storage,
    deadStorage: raw.dead_storage,
    volume: raw.volume,
    percent,
    usable,
    inflow: raw.inflow,
    outflow: raw.outflow,
    netFlow,
    band: bandOf(percent),
  };
}

export function normalizeResponse(
  raw: unknown,
  log: (msg: string) => void = console.warn,
): Dataset {
  if (!isRidResponse(raw)) throw new InvalidRidResponseError();

  const reservoirs: Reservoir[] = [];
  const seen = new Set<string>();
  let skipped = 0;

  for (const group of raw.data) {
    for (const record of group.reservoir) {
      if (!isRidReservoir(record)) {
        skipped++;
        log(`skipping invalid reservoir record in ${group.region}: ${JSON.stringify(record)}`);
        continue;
      }
      if (seen.has(record.id)) {
        skipped++;
        log(`skipping duplicate reservoir id ${record.id}`);
        continue;
      }
      seen.add(record.id);
      reservoirs.push(normalizeReservoir(record, group.region));
    }
  }

  return { date: raw.date, total: reservoirs.length, reservoirs, skipped };
}

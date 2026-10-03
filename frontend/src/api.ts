import type { ReservoirsResponse, SummaryResponse } from "./types";

export class ApiError extends Error {
  constructor(public status: number) {
    super(`API responded ${status}`);
    this.name = "ApiError";
  }
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { accept: "application/json" } });
  if (!res.ok) throw new ApiError(res.status);
  return res.json() as Promise<T>;
}

export const fetchSummary = () => getJson<SummaryResponse>("/api/summary");
export const fetchReservoirs = () => getJson<ReservoirsResponse>("/api/reservoirs");

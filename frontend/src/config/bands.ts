import type { Band } from "../types";

/**
 * Display metadata for status bands. Thresholds are computed by the backend
 * (backend/src/bands.ts); the ranges here are only labels and must match it.
 */
export const BAND_META: Record<Band, { label: string; range: string; icon: string }> = {
  critical: { label: "น้ำน้อยวิกฤต", range: "≤ 30%", icon: "▼▼" },
  low: { label: "น้ำน้อย", range: "> 30–50%", icon: "▼" },
  normal: { label: "น้ำปกติ", range: "> 50–80%", icon: "●" },
  high: { label: "น้ำมาก", range: "> 80–100%", icon: "▲" },
  over: { label: "เกินความจุ", range: "> 100%", icon: "▲▲" },
  nodata: { label: "ไม่มีข้อมูล", range: "–", icon: "–" },
};

/** Bands with a measured value, in order from least to most water. */
export const MEASURED_BANDS = ["critical", "low", "normal", "high", "over"] as const;

export const ALL_BANDS: Band[] = [...MEASURED_BANDS, "nodata"];

/**
 * Diverging palette (less water ← neutral → more water), validated for
 * color-vision deficiency on the light and dark chart surfaces.
 * Status is never shown by color alone: labels and icons always accompany it.
 */
export const BAND_COLORS: Record<"light" | "dark", Record<Band, string>> = {
  light: {
    critical: "#b42e2e",
    low: "#ec835a",
    normal: "#cfcec6",
    high: "#5598e7",
    over: "#1c5cab",
    nodata: "#898781",
  },
  dark: {
    critical: "#d03b3b",
    low: "#f0a080",
    normal: "#6b6a64",
    high: "#3987e5",
    over: "#9ec5f4",
    nodata: "#898781",
  },
};

/** Chart chrome that SVG attributes need as literal colors (CSS variables do not work there). */
export const CHART_COLORS = {
  light: { series: "#2a78d6", ink: "#0b0b0b", muted: "#898781", grid: "#e1e0d9", axis: "#c3c2b7", surface: "#fcfcfb" },
  dark: { series: "#3987e5", ink: "#ffffff", muted: "#898781", grid: "#2c2c2a", axis: "#383835", surface: "#1a1a19" },
} as const;

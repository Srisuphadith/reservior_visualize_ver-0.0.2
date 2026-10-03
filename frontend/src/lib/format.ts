const NO_DATA = "ไม่มีข้อมูล";

const volumeFmt = new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percentFmt = new Intl.NumberFormat("th-TH", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const flowFmt = new Intl.NumberFormat("th-TH", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const intFmt = new Intl.NumberFormat("th-TH");

// th-TH uses the Buddhist calendar by default; pin it so output does not depend on the runtime.
const dateFmt = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Bangkok",
});
const dateTimeFmt = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Bangkok",
});

export const UNIT_VOLUME = "ล้าน ลบ.ม.";

export function formatVolume(n: number | null): string {
  return n === null ? NO_DATA : volumeFmt.format(n);
}

export function formatPercent(n: number | null): string {
  return n === null ? NO_DATA : `${percentFmt.format(n)}%`;
}

export function formatFlow(n: number | null): string {
  return n === null ? NO_DATA : flowFmt.format(n);
}

export function formatSignedFlow(n: number | null): string {
  if (n === null) return NO_DATA;
  return n > 0 ? `+${flowFmt.format(n)}` : flowFmt.format(n);
}

export function formatInt(n: number): string {
  return intFmt.format(n);
}

/** "2026-10-03" → "3 ต.ค. 2569". Parsed as a calendar date, independent of the viewer's time zone. */
export function formatThaiDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return dateFmt.format(new Date(Date.UTC(y, m - 1, d, 5)));
}

export function formatThaiDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : dateTimeFmt.format(date);
}

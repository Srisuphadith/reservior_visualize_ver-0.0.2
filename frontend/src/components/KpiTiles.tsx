import { BAND_META } from "../config/bands";
import { formatInt, formatPercent, formatVolume, UNIT_VOLUME } from "../lib/format";
import type { GroupStats } from "../types";

interface Tile {
  label: string;
  value: string;
  unit?: string;
  note?: string;
}

export function KpiTiles({ stats }: { stats: GroupStats }) {
  const tiles: Tile[] = [
    {
      label: "จำนวนอ่างเก็บน้ำ",
      value: formatInt(stats.count),
      unit: "อ่าง",
      note: stats.bands.nodata ? `ไม่มีข้อมูลวันนี้ ${formatInt(stats.bands.nodata)} อ่าง` : undefined,
    },
    { label: "ปริมาณน้ำในอ่าง", value: formatVolume(stats.volume), unit: UNIT_VOLUME },
    {
      label: "ปริมาณน้ำต่อความจุ",
      value: formatPercent(stats.percent),
      note: `จากความจุ ${formatVolume(stats.reportingStorage)} ${UNIT_VOLUME}`,
    },
    { label: "น้ำใช้การได้", value: formatVolume(stats.usable), unit: UNIT_VOLUME },
    {
      label: `${BAND_META.critical.icon} ${BAND_META.critical.label}`,
      value: formatInt(stats.bands.critical),
      unit: "อ่าง",
      note: BAND_META.critical.range,
    },
    {
      label: `${BAND_META.over.icon} ${BAND_META.over.label}`,
      value: formatInt(stats.bands.over),
      unit: "อ่าง",
      note: BAND_META.over.range,
    },
  ];

  return (
    <section className="kpis" aria-label="สรุปภาพรวมทั้งประเทศ">
      {tiles.map((t) => (
        <div className="card kpi" key={t.label}>
          <div className="kpi-label">{t.label}</div>
          <div className="kpi-value">
            {t.value}
            {t.unit && <span className="kpi-unit"> {t.unit}</span>}
          </div>
          {t.note && <div className="kpi-note">{t.note}</div>}
        </div>
      ))}
    </section>
  );
}

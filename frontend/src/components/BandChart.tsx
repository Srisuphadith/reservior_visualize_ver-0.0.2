import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BAND_COLORS, BAND_META, CHART_COLORS, MEASURED_BANDS } from "../config/bands";
import { formatInt } from "../lib/format";
import { useColorScheme } from "../lib/hooks";
import type { RegionStats } from "../types";

interface Props {
  regions: RegionStats[];
  selected: string | null;
}

type Row = RegionStats;

function BandTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Row }> }) {
  const r = payload?.[0]?.payload;
  if (!active || !r) return null;
  return (
    <div className="tooltip">
      <strong>{r.region}</strong>
      {[...MEASURED_BANDS].reverse().map((b) => (
        <div key={b}>
          {BAND_META[b].icon} {BAND_META[b].label}: {formatInt(r.bands[b])}
        </div>
      ))}
      {r.bands.nodata > 0 && <div>– ไม่มีข้อมูล: {formatInt(r.bands.nodata)}</div>}
    </div>
  );
}

export function BandChart({ regions, selected }: Props) {
  const scheme = useColorScheme();
  const colors = BAND_COLORS[scheme];
  const c = CHART_COLORS[scheme];
  const data = selected ? regions.filter((r) => r.region === selected) : regions;
  const nodata = data.reduce((a, r) => a + r.bands.nodata, 0);

  return (
    <section className="card" aria-labelledby="band-chart-title">
      <h2 id="band-chart-title">จำนวนอ่างตามสถานะน้ำ{selected ? ` · ${selected}` : " รายภาค"}</h2>
      <ul className="legend" aria-label="คำอธิบายสี">
        {MEASURED_BANDS.map((b) => (
          <li key={b}>
            <span className="legend-swatch" style={{ background: colors[b] }} aria-hidden="true" />
            {BAND_META[b].icon} {BAND_META[b].label} <span className="muted">({BAND_META[b].range})</span>
          </li>
        ))}
      </ul>
      <div className="chart" style={{ height: Math.max(120, data.length * 44 + 20) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }} barCategoryGap={8}>
            <XAxis type="number" allowDecimals={false} tick={{ fill: c.muted, fontSize: 12 }} axisLine={{ stroke: c.axis }} tickLine={false} />
            <YAxis
              type="category"
              dataKey="region"
              width={150}
              tickLine={false}
              axisLine={{ stroke: c.axis }}
              tick={{ fill: c.ink, fontSize: 13 }}
            />
            <Tooltip content={<BandTooltip />} cursor={{ fill: c.grid, opacity: 0.5 }} />
            {MEASURED_BANDS.map((b) => (
              <Bar
                key={b}
                dataKey={(r: Row) => r.bands[b]}
                name={BAND_META[b].label}
                stackId="bands"
                fill={colors[b]}
                stroke={c.surface}
                strokeWidth={2}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {nodata > 0 && <p className="muted small">ไม่รวมอ่างที่ไม่มีข้อมูลวันนี้ {formatInt(nodata)} อ่าง</p>}
    </section>
  );
}

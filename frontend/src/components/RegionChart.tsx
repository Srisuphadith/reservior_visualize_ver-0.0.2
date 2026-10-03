import { Bar, BarChart, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS } from "../config/bands";
import { formatInt, formatPercent, formatVolume, UNIT_VOLUME } from "../lib/format";
import { useColorScheme } from "../lib/hooks";
import type { RegionStats } from "../types";

interface Props {
  regions: RegionStats[];
  selected: string | null;
  onSelect: (region: string | null) => void;
}

function RegionTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: RegionStats }> }) {
  const r = payload?.[0]?.payload;
  if (!active || !r) return null;
  return (
    <div className="tooltip">
      <strong>{r.region}</strong>
      <div>ปริมาณน้ำต่อความจุ: {formatPercent(r.percent)}</div>
      <div>
        ปริมาณน้ำ: {formatVolume(r.volume)} / {formatVolume(r.reportingStorage)} {UNIT_VOLUME}
      </div>
      <div>
        น้ำใช้การได้: {formatVolume(r.usable)} {UNIT_VOLUME}
      </div>
      <div>
        จำนวน: {formatInt(r.count)} อ่าง{r.bands.nodata ? ` (ไม่มีข้อมูล ${r.bands.nodata})` : ""}
      </div>
    </div>
  );
}

export function RegionChart({ regions, selected, onSelect }: Props) {
  const c = CHART_COLORS[useColorScheme()];
  const data = [...regions].sort((a, b) => (b.percent ?? -1) - (a.percent ?? -1));
  const max = Math.max(100, ...data.map((d) => d.percent ?? 0));

  return (
    <section className="card" aria-labelledby="region-chart-title">
      <h2 id="region-chart-title">ปริมาณน้ำต่อความจุ รายภาค</h2>
      <p className="muted small">คิดจากผลรวมปริมาณน้ำ ÷ ผลรวมความจุของอ่างที่รายงานข้อมูล · คลิกแท่งเพื่อกรองภาค</p>
      <div className="chart" style={{ height: Math.max(220, data.length * 44) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 56, bottom: 4, left: 8 }} barCategoryGap={8}>
            <XAxis type="number" domain={[0, Math.ceil(max / 10) * 10]} hide />
            <YAxis
              type="category"
              dataKey="region"
              width={150}
              tickLine={false}
              axisLine={{ stroke: c.axis }}
              tick={{ fill: c.ink, fontSize: 13 }}
            />
            <ReferenceLine
              x={100}
              stroke={c.muted}
              strokeDasharray="4 4"
              label={{ value: "100%", position: "insideTopRight", fill: c.muted, fontSize: 11 }}
            />
            <Tooltip content={<RegionTooltip />} cursor={{ fill: c.grid, opacity: 0.5 }} />
            <Bar
              dataKey="percent"
              radius={[0, 4, 4, 0]}
              cursor="pointer"
              isAnimationActive={false}
              onClick={(d) => {
                const region = (d as unknown as { payload?: RegionStats }).payload?.region;
                if (region) onSelect(region === selected ? null : region);
              }}
            >
              {data.map((d) => (
                <Cell key={d.region} fill={c.series} fillOpacity={selected && selected !== d.region ? 0.3 : 1} />
              ))}
              <LabelList
                dataKey="percent"
                position="right"
                formatter={(v: unknown) => formatPercent(typeof v === "number" ? v : null)}
                style={{ fill: c.ink, fontSize: 12 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

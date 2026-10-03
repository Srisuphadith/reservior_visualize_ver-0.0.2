import { useId } from "react";
import { ALL_BANDS, BAND_META } from "../config/bands";
import type { Filters } from "../lib/filters";
import type { Band } from "../types";

interface Props {
  regions: string[];
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
}

export function FilterBar({ regions, filters, onChange }: Props) {
  const id = useId();
  const active = filters.region !== null || filters.band !== null || filters.q !== "";
  return (
    <section className="filters" aria-label="ตัวกรอง">
      <div className="field">
        <label htmlFor={`${id}-region`}>ภาค</label>
        <select
          id={`${id}-region`}
          value={filters.region ?? ""}
          onChange={(e) => onChange({ region: e.target.value || null })}
        >
          <option value="">ทุกภาค</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor={`${id}-band`}>สถานะ</label>
        <select
          id={`${id}-band`}
          value={filters.band ?? ""}
          onChange={(e) => onChange({ band: (e.target.value || null) as Band | null })}
        >
          <option value="">ทุกสถานะ</option>
          {ALL_BANDS.map((b) => (
            <option key={b} value={b}>
              {BAND_META[b].label} ({BAND_META[b].range})
            </option>
          ))}
        </select>
      </div>
      <div className="field filters-search">
        <label htmlFor={`${id}-q`}>ค้นหา</label>
        <input
          id={`${id}-q`}
          type="search"
          placeholder="ชื่ออ่าง หรือรหัส เช่น rsv01"
          value={filters.q}
          onChange={(e) => onChange({ q: e.target.value })}
        />
      </div>
      {active && (
        <button type="button" className="button-ghost" onClick={() => onChange({ region: null, band: null, q: "" })}>
          ล้างตัวกรอง
        </button>
      )}
    </section>
  );
}

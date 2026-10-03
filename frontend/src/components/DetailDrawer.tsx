import { useEffect, useRef } from "react";
import { BAND_COLORS } from "../config/bands";
import { formatFlow, formatPercent, formatSignedFlow, formatVolume, UNIT_VOLUME } from "../lib/format";
import { useColorScheme } from "../lib/hooks";
import type { Reservoir } from "../types";
import { StatusBadge } from "./StatusBadge";

interface Props {
  reservoir: Reservoir | null;
  onClose: () => void;
}

/** Dead storage, current volume and capacity drawn on one scale. */
function CapacityBar({ r }: { r: Reservoir }) {
  const colors = BAND_COLORS[useColorScheme()];
  const scale = Math.max(r.storage, r.volume ?? 0) || 1;
  const pct = (n: number) => `${Math.min((n / scale) * 100, 100)}%`;
  return (
    <figure className="capacity">
      <div
        className="capacity-track"
        role="img"
        aria-label={`ปริมาณน้ำ ${formatVolume(r.volume)} จากความจุ ${formatVolume(r.storage)} ${UNIT_VOLUME}`}
      >
        {r.volume !== null && (
          <div className="capacity-fill" style={{ width: pct(r.volume), background: colors[r.band] }} />
        )}
        <div className="capacity-mark capacity-dead" style={{ left: pct(r.deadStorage) }} />
        <div className="capacity-mark capacity-full" style={{ left: pct(r.storage) }} />
      </div>
      <figcaption className="muted small">
        เส้นประ = น้ำเก็บกักต่ำสุด ({formatVolume(r.deadStorage)}) · เส้นทึบ = ความจุ ({formatVolume(r.storage)})
      </figcaption>
    </figure>
  );
}

export function DetailDrawer({ reservoir: r, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!r) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [r, onClose]);

  if (!r) return null;

  const rows: Array<[string, string]> = [
    ["รหัส", r.id],
    ["ภาค", r.region],
    ["ความจุ (เก็บกัก)", `${formatVolume(r.storage)} ${UNIT_VOLUME}`],
    ["น้ำเก็บกักต่ำสุด", `${formatVolume(r.deadStorage)} ${UNIT_VOLUME}`],
    ["ปริมาณน้ำในอ่าง", r.volume === null ? formatVolume(null) : `${formatVolume(r.volume)} ${UNIT_VOLUME}`],
    ["% ความจุ", formatPercent(r.percent)],
    ["น้ำใช้การได้", r.usable === null ? formatVolume(null) : `${formatVolume(r.usable)} ${UNIT_VOLUME}`],
    ["น้ำไหลเข้า", formatFlow(r.inflow)],
    ["น้ำระบาย", formatFlow(r.outflow)],
    ["สุทธิ (ไหลเข้า − ระบาย)", formatSignedFlow(r.netFlow)],
  ];

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-head">
          <h2 id="drawer-title">{r.displayName}</h2>
          <button ref={closeRef} type="button" className="button-ghost" onClick={onClose} aria-label="ปิด">
            ✕
          </button>
        </div>
        <StatusBadge band={r.band} />
        <CapacityBar r={r} />
        <dl className="detail-list">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <p className="muted small">หน่วยเวลาของน้ำไหลเข้า/ระบายยังไม่ได้ระบุโดยกรมชลประทาน (น่าจะเป็นต่อวัน)</p>
        {r.name !== r.displayName && <p className="muted small">ชื่อตามต้นฉบับ: {r.name}</p>}
      </aside>
    </div>
  );
}

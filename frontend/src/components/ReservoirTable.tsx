import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import { ALL_BANDS, BAND_META } from "../config/bands";
import { formatFlow, formatInt, formatPercent, formatVolume } from "../lib/format";
import type { Reservoir } from "../types";
import { StatusBadge } from "./StatusBadge";

const col = createColumnHelper<Reservoir>();
const thai = new Intl.Collator("th");

// Nulls become undefined so `sortUndefined: "last"` keeps them at the bottom in both directions.
const num = (key: "storage" | "volume" | "percent" | "usable" | "inflow" | "outflow", header: string, fmt: (n: number | null) => string) =>
  col.accessor((r) => r[key] ?? undefined, {
    id: key,
    header,
    cell: (info) => fmt(info.row.original[key]),
    sortUndefined: "last",
    meta: { numeric: true },
  });

const columns = [
  col.accessor("displayName", {
    header: "ชื่ออ่าง",
    sortingFn: (a, b) => thai.compare(a.original.displayName, b.original.displayName),
  }),
  col.accessor("id", { header: "รหัส" }),
  col.accessor("region", { header: "ภาค", sortingFn: (a, b) => thai.compare(a.original.region, b.original.region) }),
  num("storage", "ความจุ", formatVolume),
  num("volume", "ปริมาณน้ำ", formatVolume),
  num("percent", "% ความจุ", formatPercent),
  num("usable", "น้ำใช้การได้", formatVolume),
  num("inflow", "น้ำไหลเข้า", formatFlow),
  num("outflow", "น้ำระบาย", formatFlow),
  col.accessor("band", {
    header: "สถานะ",
    cell: (info) => <StatusBadge band={info.getValue()} />,
    sortingFn: (a, b) => ALL_BANDS.indexOf(a.original.band) - ALL_BANDS.indexOf(b.original.band),
  }),
];

interface Props {
  rows: Reservoir[];
  onSelect: (r: Reservoir) => void;
}

export function ReservoirTable({ rows, onSelect }: Props) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "percent", desc: false }]);
  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    // Toggle asc ↔ desc only; never drop back to the unsorted API order.
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (r) => r.id,
  });

  return (
    <section className="card" aria-labelledby="table-title">
      <h2 id="table-title">
        รายชื่ออ่างเก็บน้ำ <span className="muted">({formatInt(rows.length)} อ่าง)</span>
      </h2>
      <p className="muted small">
        หน่วย: ล้าน ลบ.ม. · คลิกหัวตารางเพื่อเรียง · คลิกแถวเพื่อดูรายละเอียด · สถานะ:{" "}
        {ALL_BANDS.map((b) => `${BAND_META[b].label} ${BAND_META[b].range}`).join(" · ")}
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => {
                  const sorted = h.column.getIsSorted();
                  const numeric = (h.column.columnDef.meta as { numeric?: boolean } | undefined)?.numeric;
                  return (
                    <th
                      key={h.id}
                      className={numeric ? "num" : undefined}
                      aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"}
                    >
                      <button type="button" className="th-button" onClick={h.column.getToggleSortingHandler()}>
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        <span aria-hidden="true">{sorted === "asc" ? " ↑" : sorted === "desc" ? " ↓" : ""}</span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                tabIndex={0}
                className="row-clickable"
                onClick={() => onSelect(row.original)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(row.original);
                  }
                }}
              >
                {row.getVisibleCells().map((cell) => {
                  const numeric = (cell.column.columnDef.meta as { numeric?: boolean } | undefined)?.numeric;
                  return (
                    <td key={cell.id} className={numeric ? "num" : undefined}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="muted empty">ไม่พบอ่างเก็บน้ำที่ตรงกับตัวกรอง</p>}
      </div>
    </section>
  );
}

import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { fetchReservoirs, fetchSummary } from "./api";
import { BandChart } from "./components/BandChart";
import { DetailDrawer } from "./components/DetailDrawer";
import { FilterBar } from "./components/FilterBar";
import { Header } from "./components/Header";
import { KpiTiles } from "./components/KpiTiles";
import { RankList } from "./components/RankList";
import { RegionChart } from "./components/RegionChart";
import { ReservoirTable } from "./components/ReservoirTable";
import { applyFilters, lowest, overCapacity } from "./lib/filters";
import { useUrlFilters } from "./lib/hooks";
import type { Reservoir } from "./types";

export function App() {
  const summary = useQuery({ queryKey: ["summary"], queryFn: fetchSummary });
  const reservoirs = useQuery({ queryKey: ["reservoirs"], queryFn: fetchReservoirs });
  const [filters, setFilters] = useUrlFilters();
  const [selected, setSelected] = useState<Reservoir | null>(null);
  const close = useCallback(() => setSelected(null), []);

  const all = reservoirs.data?.reservoirs;
  const byRegion = useMemo(
    () => (all ? applyFilters(all, { region: filters.region, band: null, q: "" }) : []),
    [all, filters.region],
  );
  const tableRows = useMemo(() => (all ? applyFilters(all, filters) : []), [all, filters]);

  if (summary.isPending || reservoirs.isPending) {
    return (
      <main className="page">
        <Header />
        <p className="card" role="status">
          กำลังโหลดข้อมูล…
        </p>
      </main>
    );
  }

  if (summary.isError || reservoirs.isError) {
    return (
      <main className="page">
        <Header />
        <div className="card error" role="alert">
          <strong>โหลดข้อมูลไม่สำเร็จ</strong>
          <p>ไม่สามารถดึงข้อมูลจากกรมชลประทานได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง</p>
          <button
            type="button"
            onClick={() => {
              void summary.refetch();
              void reservoirs.refetch();
            }}
          >
            ลองใหม่
          </button>
        </div>
      </main>
    );
  }

  const s = summary.data;
  const regionNames = s.regions.map((r) => r.region);

  return (
    <main className="page">
      <Header date={s.date} fetchedAt={s.fetchedAt} stale={s.stale || reservoirs.data.stale} />
      <KpiTiles stats={s.national} />
      <FilterBar regions={regionNames} filters={filters} onChange={setFilters} />
      <div className="grid-2">
        <RegionChart regions={s.regions} selected={filters.region} onSelect={(region) => setFilters({ region })} />
        <BandChart regions={s.regions} selected={filters.region} />
      </div>
      <div className="grid-2">
        <RankList
          id="lowest-title"
          title="10 อ่างที่น้ำน้อยที่สุด"
          items={lowest(byRegion, 10)}
          empty="ไม่มีข้อมูล"
          onSelect={setSelected}
        />
        <RankList
          id="over-title"
          title="อ่างที่น้ำเกินความจุ (> 100%)"
          items={overCapacity(byRegion)}
          empty="ไม่มีอ่างที่น้ำเกินความจุ"
          onSelect={setSelected}
        />
      </div>
      <ReservoirTable rows={tableRows} onSelect={setSelected} />
      <footer className="footer muted small">
        ข้อมูลอ่างเก็บน้ำ: © กรมชลประทาน (Royal Irrigation Department) ·{" "}
        <a href="https://app.rid.go.th/reservoir" target="_blank" rel="noreferrer">
          app.rid.go.th/reservoir
        </a>
      </footer>
      <DetailDrawer reservoir={selected} onClose={close} />
    </main>
  );
}

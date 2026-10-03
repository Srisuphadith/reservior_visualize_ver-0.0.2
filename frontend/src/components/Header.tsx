import { formatThaiDate, formatThaiDateTime } from "../lib/format";

interface Props {
  date?: string;
  fetchedAt?: string;
  stale?: boolean;
}

export function Header({ date, fetchedAt, stale }: Props) {
  return (
    <header className="header">
      <div>
        <h1>ปริมาณน้ำในอ่างเก็บน้ำ ประเทศไทย</h1>
        <p className="muted">ข้อมูลอ่างเก็บน้ำจากกรมชลประทาน</p>
      </div>
      {date && (
        <dl className="header-meta">
          <div>
            <dt>ข้อมูลวันที่</dt>
            <dd title={date}>{formatThaiDate(date)}</dd>
          </div>
          {fetchedAt && (
            <div>
              <dt>ดึงข้อมูลล่าสุด</dt>
              <dd title={fetchedAt}>{formatThaiDateTime(fetchedAt)}</dd>
            </div>
          )}
          {stale && (
            <div className="stale" role="status">
              ⚠ ข้อมูลอาจไม่เป็นปัจจุบัน (ดึงข้อมูลจากกรมชลประทานไม่สำเร็จ)
            </div>
          )}
        </dl>
      )}
    </header>
  );
}

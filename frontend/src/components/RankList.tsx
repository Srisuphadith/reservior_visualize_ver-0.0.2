import { formatPercent, formatVolume, UNIT_VOLUME } from "../lib/format";
import type { Reservoir } from "../types";
import { StatusBadge } from "./StatusBadge";

interface Props {
  id: string;
  title: string;
  items: Reservoir[];
  empty: string;
  onSelect: (r: Reservoir) => void;
}

export function RankList({ id, title, items, empty, onSelect }: Props) {
  return (
    <section className="card" aria-labelledby={id}>
      <h2 id={id}>
        {title} <span className="muted">({items.length})</span>
      </h2>
      {items.length === 0 ? (
        <p className="muted">{empty}</p>
      ) : (
        <ol className="rank-list">
          {items.map((r) => (
            <li key={r.id}>
              <button type="button" className="rank-item" onClick={() => onSelect(r)}>
                <span className="rank-name">
                  {r.displayName}
                  <span className="muted small">
                    {" "}
                    {r.id} · {r.region}
                  </span>
                </span>
                <span className="rank-value">
                  <strong>{formatPercent(r.percent)}</strong>
                  <span className="muted small">
                    {formatVolume(r.volume)} / {formatVolume(r.storage)} {UNIT_VOLUME}
                  </span>
                </span>
                <StatusBadge band={r.band} />
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

import { BAND_META } from "../config/bands";
import type { Band } from "../types";

export function StatusBadge({ band }: { band: Band }) {
  const meta = BAND_META[band];
  return (
    <span className={`badge badge-${band}`} title={meta.range}>
      <span className="badge-swatch" aria-hidden="true">
        {meta.icon}
      </span>
      {meta.label}
    </span>
  );
}

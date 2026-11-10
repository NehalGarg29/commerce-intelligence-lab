import { Star } from "lucide-react";

// Five stars with partial fill, plus an accessible text label.
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="relative inline-flex" role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      <span className="flex text-lavender-100" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} size={size} fill="currentColor" strokeWidth={0} />
        ))}
      </span>
      <span
        className="absolute inset-y-0 left-0 flex overflow-hidden text-plum-700"
        style={{ width: `${(value / 5) * 100}%` }}
        aria-hidden="true"
      >
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} size={size} fill="currentColor" strokeWidth={0} className="shrink-0" />
        ))}
      </span>
    </span>
  );
}

export function RatingInline({ average, count, size = 13 }: { average: number; count: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted">
      <Stars value={average} size={size} />
      <span className="text-ink">{average.toFixed(1)}</span>
      <span>({count})</span>
    </span>
  );
}

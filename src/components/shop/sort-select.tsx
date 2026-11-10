"use client";

import { useRouter } from "next/navigation";
import { SORTS, type SortKey } from "@/lib/catalog/filters";

// The only client-side piece of the shop page: changing the sort updates the URL.
export function SortSelect({ value, hrefs }: { value: SortKey; hrefs: Record<SortKey, string> }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm text-ink-muted">
      <span className="hidden sm:inline">Sort by</span>
      <select
        value={value}
        onChange={(e) => router.push(hrefs[e.target.value as SortKey], { scroll: false })}
        className="h-11 rounded-full border border-lavender-100 bg-white px-4 pr-9 text-sm text-ink outline-none transition focus:border-plum-700"
      >
        {(Object.keys(SORTS) as SortKey[]).map((key) => (
          <option key={key} value={key}>
            {SORTS[key]}
          </option>
        ))}
      </select>
    </label>
  );
}

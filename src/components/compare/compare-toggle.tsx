"use client";

import { Check, Plus } from "lucide-react";
import { useCompare, type CompareItem } from "@/lib/compare-store";
import { track } from "@/lib/analytics/track";

export function CompareToggle({ item, variant = "card" }: { item: CompareItem; variant?: "card" | "inline" }) {
  const { has, isFull, toggle } = useCompare();
  const selected = has(item.handle);
  const disabled = !selected && isFull;
  const label = selected ? "Comparing" : disabled ? "Compare full (3)" : "Compare";

  return (
    <button
      type="button"
      onClick={() => {
        if (!has(item.handle) && !isFull) track("compare_add", { productHandle: item.handle });
        toggle(item);
      }}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${selected ? "Remove" : "Add"} ${item.title} ${selected ? "from" : "to"} comparison`}
      className={
        variant === "card"
          ? `flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium shadow-sm backdrop-blur transition ${
              selected ? "bg-plum-700 text-white" : "bg-white/90 text-plum-800 hover:bg-white"
            } disabled:cursor-not-allowed disabled:opacity-60`
          : `flex h-11 items-center gap-2 rounded-full border px-5 text-sm transition ${
              selected ? "border-plum-700 bg-plum-700 text-white" : "border-lavender-100 bg-white text-ink hover:border-plum-700"
            } disabled:cursor-not-allowed disabled:opacity-60`
      }
    >
      {selected ? <Check size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}
      {label}
    </button>
  );
}

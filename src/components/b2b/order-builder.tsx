"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, Megaphone, Minus, Plus } from "lucide-react";
import { formatPrice } from "@/lib/format";

export type OrderRow = {
  handle: string;
  title: string;
  brand: string;
  imageUrl: string | null;
  retail: number;
  wholesale: number;
  margin: number;
  stock: number | null;
  score: number;
  suggestedUnits: number;
  reasons: string[];
};

const MAX_UNITS = 99;

export function OrderBuilder({ rows, retailer, currency }: { rows: OrderRow[]; retailer: string; currency: string }) {
  const [qty, setQty] = useState<Record<string, number>>(() => Object.fromEntries(rows.map((r) => [r.handle, r.suggestedUnits])));

  const set = (r: OrderRow, n: number) => {
    const cap = r.stock ?? MAX_UNITS;
    setQty((q) => ({ ...q, [r.handle]: Math.max(0, Math.min(cap, MAX_UNITS, n)) }));
  };

  const totals = useMemo(() => {
    let units = 0;
    let cost = 0;
    let retailValue = 0;
    for (const r of rows) {
      const n = qty[r.handle] ?? 0;
      units += n;
      cost += n * r.wholesale;
      retailValue += n * r.retail;
    }
    return { units, cost, retailValue };
  }, [rows, qty]);

  function downloadCsv() {
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const lines = [
      ["Product", "Handle", "Units", `Wholesale (${currency})`, `Line total (${currency})`, `Retail (${currency})`].join(","),
      ...rows
        .filter((r) => (qty[r.handle] ?? 0) > 0)
        .map((r) => [esc(r.title), r.handle, qty[r.handle], r.wholesale.toFixed(2), (qty[r.handle] * r.wholesale).toFixed(2), r.retail.toFixed(2)].join(",")),
      ["", "", totals.units, "", totals.cost.toFixed(2), ""].join(","),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `purchase-order-${retailer.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-lavender-100 bg-white">
      <ul className="divide-y divide-lavender-100">
        {rows.map((r) => (
          <li key={r.handle} className="grid gap-4 p-5 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto] md:items-center md:p-6">
            <div className="flex min-w-0 gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-lavender-50">
                {r.imageUrl && <Image src={r.imageUrl} alt="" fill sizes="64px" className="object-cover" />}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] tracking-[0.16em] text-ink-muted">{r.brand.toUpperCase()}</p>
                <p className="font-display text-lg text-ink">{r.title}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">{r.reasons.join(" · ") || "New to the range"}</p>
                <Link href={`/retail/kit/${r.handle}`} className="mt-1.5 inline-flex items-center gap-1.5 text-[12px] font-medium text-plum-800 underline-offset-4 hover:underline">
                  <Megaphone size={13} aria-hidden="true" /> Marketing kit
                </Link>
              </div>
            </div>
            <dl className="grid grid-cols-3 gap-3 text-[13px]">
              <div>
                <dt className="text-ink-muted">Wholesale</dt>
                <dd className="text-ink tabular-nums">{formatPrice(r.wholesale)}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Retail</dt>
                <dd className="text-ink tabular-nums">{formatPrice(r.retail)}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Margin</dt>
                <dd className="text-ink tabular-nums">{Math.round(r.margin * 100)}%</dd>
              </div>
            </dl>
            <div className="flex items-center gap-3 md:justify-end">
              <span className="text-[12px] text-ink-muted">{r.stock !== null ? `${r.stock} available` : "In stock"}</span>
              <div className="flex items-center rounded-full border border-lavender-100">
                <button type="button" onClick={() => set(r, (qty[r.handle] ?? 0) - 1)} aria-label={`Fewer ${r.title}`} className="p-2.5 text-ink-muted hover:text-plum-700">
                  <Minus size={14} aria-hidden="true" />
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={r.stock ?? MAX_UNITS}
                  value={qty[r.handle] ?? 0}
                  onChange={(e) => set(r, Number(e.target.value) || 0)}
                  aria-label={`Units of ${r.title}`}
                  className="w-10 bg-transparent text-center text-[14px] tabular-nums outline-none"
                />
                <button type="button" onClick={() => set(r, (qty[r.handle] ?? 0) + 1)} aria-label={`More ${r.title}`} className="p-2.5 text-ink-muted hover:text-plum-700">
                  <Plus size={14} aria-hidden="true" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-lavender-100 bg-ivory/60 p-5 md:p-6">
        <p className="text-[14px] text-ink">
          <span className="font-medium">{totals.units} units</span> · Wholesale {formatPrice(totals.cost)}
          <span className="text-ink-muted"> · Retail value {formatPrice(totals.retailValue)}</span>
        </p>
        <button
          type="button"
          onClick={downloadCsv}
          disabled={totals.units === 0}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-plum-700 px-6 text-sm font-medium text-white transition hover:bg-plum-800 disabled:opacity-40"
        >
          <Download size={15} aria-hidden="true" /> Download purchase order (CSV)
        </button>
      </div>
    </div>
  );
}

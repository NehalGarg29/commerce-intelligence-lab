"use client";

import { useActionState, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Download, Megaphone, Minus, Package, Plus, Send, Truck, TrendingUp } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { CatalogEntry, KitView } from "@/lib/b2b/kits";
import { computeOrder, type OrderInput } from "@/lib/b2b/order";
import { FREE_FREIGHT_MIN, VOLUME_TIERS } from "@/lib/b2b/program";
import { placeWholesaleOrderAction, type WholesaleOrderState } from "@/app/actions/b2b";

export type RecommendedRow = {
  handle: string;
  imageUrl: string | null;
  margin: number;
  suggestedUnits: number;
  reasons: string[];
};

const MAX_UNITS = 99;

function Stepper({ value, onChange, max, label }: { value: number; onChange: (n: number) => void; max: number; label: string }) {
  const set = (n: number) => onChange(Math.max(0, Math.min(max, n)));
  return (
    <div className="flex items-center rounded-full border border-lavender-100 bg-white">
      <button type="button" onClick={() => set(value - 1)} aria-label={`Fewer ${label}`} className="p-2.5 text-ink-muted hover:text-plum-700">
        <Minus size={14} aria-hidden="true" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        value={value}
        onChange={(e) => set(Number(e.target.value) || 0)}
        aria-label={`Quantity of ${label}`}
        className="w-10 bg-transparent text-center text-[14px] tabular-nums outline-none"
      />
      <button type="button" onClick={() => set(value + 1)} aria-label={`More ${label}`} className="p-2.5 text-ink-muted hover:text-plum-700">
        <Plus size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

function Progress({ value, label, done, icon: Icon }: { value: number; label: string; done: boolean; icon: typeof Truck }) {
  return (
    <div>
      <p className={`flex items-center gap-2 text-[13px] ${done ? "text-[#2F5D36]" : "text-ink"}`}>
        {done ? <Check size={15} aria-hidden="true" /> : <Icon size={15} className="text-plum-700" aria-hidden="true" />} {label}
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-lavender-50" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full rounded-full ${done ? "bg-[#4E8A5A]" : "bg-plum-700"}`} style={{ width: `${Math.min(100, value * 100)}%` }} />
      </div>
    </div>
  );
}

export function OrderBuilder({
  retailerId,
  retailer,
  currency,
  catalog,
  kits,
  recommended,
  canSubmit,
}: {
  retailerId: string;
  retailer: string;
  currency: string;
  catalog: Record<string, CatalogEntry>;
  kits: KitView[];
  recommended: RecommendedRow[];
  canSubmit: boolean;
}) {
  // Start empty so the retailer sees the tier and freight bars fill as they add.
  const [input, setInput] = useState<OrderInput>({ items: {}, kits: {} });
  const fillSuggested = () =>
    setInput((s) => ({ ...s, items: Object.fromEntries(recommended.map((r) => [r.handle, r.suggestedUnits])) }));
  const [state, action, pending] = useActionState<WholesaleOrderState, FormData>(placeWholesaleOrderAction, { status: "idle", message: "" });
  const order = useMemo(() => computeOrder(input, catalog, kits), [input, catalog, kits]);

  const setItem = (h: string, n: number) => setInput((s) => ({ ...s, items: { ...s.items, [h]: n } }));
  const setKit = (id: string, n: number) => setInput((s) => ({ ...s, kits: { ...s.kits, [id]: n } }));

  const top = VOLUME_TIERS[VOLUME_TIERS.length - 1];
  const tierProgress = order.next ? order.subtotal / order.next.min : 1;
  const freightProgress = order.subtotal === 0 ? 0 : order.freight === 0 ? 1 : (FREE_FREIGHT_MIN - order.freightRemaining) / FREE_FREIGHT_MIN;

  function downloadCsv() {
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const rows = [
      ["Product", "Handle", "Units", `Unit wholesale (${currency})`, `Line (${currency})`].join(","),
      ...order.lines.map((l) => [esc(l.title), l.handle, l.units, l.unitPrice.toFixed(2), (l.units * l.unitPrice).toFixed(2)].join(",")),
      ["Kit savings", "", "", "", (-order.kitSavings).toFixed(2)].join(","),
      [order.tier ? `${order.tier.name} tier` : "Volume tier", "", "", "", (-order.tierSavings).toFixed(2)].join(","),
      ["Freight", "", "", "", order.freight.toFixed(2)].join(","),
      ["Total", "", order.units, "", order.total.toFixed(2)].join(","),
    ];
    const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `purchase-order-${retailer.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div className="min-w-0 space-y-10">
        {/* Shelf-ready kits */}
        <section aria-labelledby="kits-title">
          <h3 id="kits-title" className="font-display text-2xl text-plum-800">Shelf-ready kits</h3>
          <p className="mt-1 text-[14px] text-ink-muted">Curated assortments with an extra discount, ready to merchandise as a set.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {kits.map((k) => (
              <div key={k.id} className="flex flex-col rounded-3xl border border-lavender-100 bg-white p-5">
                <div className="flex items-start justify-between gap-2">
                  <Package size={20} className="text-plum-700" aria-hidden="true" />
                  <span className="rounded-full bg-[#E3F0E7] px-2.5 py-1 text-[11px] font-medium text-[#1F4D30]">Extra {k.discountPct}% off</span>
                </div>
                <p className="mt-3 font-display text-lg text-ink">{k.name}</p>
                <p className="text-[12px] text-ink-muted">{k.occasion}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{k.blurb}</p>
                <p className="mt-3 text-[12px] text-ink-muted">
                  {k.lines.length} products · {k.units} units
                </p>
                <dl className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-ivory p-3 text-[12px]">
                  <div>
                    <dt className="text-ink-muted">You pay</dt>
                    <dd className="text-ink tabular-nums">{formatPrice(k.cost)}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">At MSRP</dt>
                    <dd className="text-ink tabular-nums">{formatPrice(k.retailValue)}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">Profit at MSRP</dt>
                    <dd className="font-medium text-[#2F5D36] tabular-nums">{formatPrice(k.profit)}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex flex-1 items-end justify-between gap-3">
                  {k.available ? (
                    <>
                      <span className="text-[12px] text-ink-muted">Kits</span>
                      <Stepper value={input.kits[k.id] ?? 0} onChange={(n) => setKit(k.id, n)} max={5} label={k.name} />
                    </>
                  ) : (
                    <p className="text-[12px] text-[#8A4B0F]">Not enough stock of {k.missing.join(", ")}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recommended products */}
        <section aria-labelledby="rec-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 id="rec-title" className="font-display text-2xl text-plum-800">Recommended to stock</h3>
              <p className="mt-1 text-[14px] text-ink-muted">
                Ranked by what shoppers view and add to bag on our storefront (last 14 days) and by review rating.
              </p>
            </div>
            <button
              type="button"
              onClick={fillSuggested}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-plum-700 px-4 text-[13px] font-medium text-plum-700 transition hover:bg-lavender-50"
            >
              <TrendingUp size={14} aria-hidden="true" /> Use suggested quantities
            </button>
          </div>
          <ul className="mt-5 divide-y divide-lavender-100 overflow-hidden rounded-3xl border border-lavender-100 bg-white">
            {recommended.map((r) => {
              const c = catalog[r.handle];
              return (
                <li key={r.handle} className="grid gap-4 p-5 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto] md:items-center">
                  <div className="flex min-w-0 gap-4">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-lavender-50">
                      {r.imageUrl && <Image src={r.imageUrl} alt="" fill sizes="56px" className="object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] tracking-[0.16em] text-ink-muted">{c.brand.toUpperCase()}</p>
                      <p className="font-display text-lg text-ink">{c.title}</p>
                      <p className="mt-0.5 text-[12px] text-ink-muted">{r.reasons.join(" · ") || "New to the range"}</p>
                      <Link href={`/retail/kit/${r.handle}`} className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-medium text-plum-800 hover:underline">
                        <Megaphone size={13} aria-hidden="true" /> Marketing kit
                      </Link>
                    </div>
                  </div>
                  <dl className="grid grid-cols-3 gap-3 text-[13px]">
                    <div>
                      <dt className="text-ink-muted">Wholesale</dt>
                      <dd className="tabular-nums">{formatPrice(c.wholesale)}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-muted">MSRP</dt>
                      <dd className="tabular-nums">{formatPrice(c.retail)}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-muted">Margin at MSRP</dt>
                      <dd className="tabular-nums">{Math.round(r.margin * 100)}%</dd>
                    </div>
                  </dl>
                  <div className="flex items-center gap-3 md:justify-end">
                    <span className="text-right text-[12px] leading-tight text-ink-muted">
                      Suggested {r.suggestedUnits}
                      <br />
                      {c.stock !== null ? `${c.stock} available` : "In stock"}
                    </span>
                    <Stepper value={input.items[r.handle] ?? 0} onChange={(n) => setItem(r.handle, n)} max={c.stock ?? MAX_UNITS} label={c.title} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* Order summary */}
      <aside className="space-y-5 rounded-3xl border border-lavender-100 bg-white p-6 lg:sticky lg:top-28" aria-label="Order summary">
        <p className="font-display text-xl text-ink">Your order</p>

        <div className="space-y-4">
          <Progress
            icon={TrendingUp}
            value={tierProgress}
            done={!order.next}
            label={
              order.next
                ? `Add ${formatPrice(order.next.remaining)} for ${order.next.name}: extra ${order.next.extraPct}% off`
                : `${top.name} tier unlocked: extra ${top.extraPct}% off`
            }
          />
          <Progress
            icon={Truck}
            value={freightProgress}
            done={order.subtotal > 0 && order.freight === 0}
            label={order.subtotal > 0 && order.freight === 0 ? "Free freight unlocked" : `${formatPrice(order.subtotal === 0 ? FREE_FREIGHT_MIN : order.freightRemaining)} away from free freight`}
          />
        </div>

        <dl className="space-y-2 border-t border-lavender-100 pt-4 text-[14px]">
          <div className="flex justify-between">
            <dt className="text-ink-muted">{order.units} units at wholesale</dt>
            <dd className="tabular-nums">{formatPrice(order.grossSubtotal)}</dd>
          </div>
          {order.kitSavings > 0 && (
            <div className="flex justify-between text-[#2F5D36]">
              <dt>Kit savings</dt>
              <dd className="tabular-nums">−{formatPrice(order.kitSavings)}</dd>
            </div>
          )}
          {order.tier && (
            <div className="flex justify-between text-[#2F5D36]">
              <dt>{order.tier.name} tier ({order.tier.extraPct}%)</dt>
              <dd className="tabular-nums">−{formatPrice(order.tierSavings)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-ink-muted">Freight</dt>
            <dd className="tabular-nums">{order.freight === 0 ? (order.units ? "Free" : "—") : formatPrice(order.freight)}</dd>
          </div>
          <div className="flex justify-between border-t border-lavender-100 pt-2 font-medium">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatPrice(order.total)}</dd>
          </div>
          <div className="flex justify-between text-[13px]">
            <dt className="text-ink-muted">Value at suggested retail</dt>
            <dd className="tabular-nums">{formatPrice(order.retailValue)}</dd>
          </div>
          <div className="flex justify-between text-[13px] font-medium text-[#2F5D36]">
            <dt>Est. profit at MSRP</dt>
            <dd className="tabular-nums">{formatPrice(Math.max(0, order.retailValue - order.total))}</dd>
          </div>
        </dl>

        {order.problems.length > 0 && <p className="text-[13px] text-[#8A4B0F]">{order.problems.join(" ")}</p>}

        {state.status === "placed" ? (
          <p role="status" className="flex items-start gap-2 rounded-2xl bg-[#E3F0E7] p-4 text-[14px] text-[#1F4D30]">
            <Check size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> {state.message}
          </p>
        ) : (
          <form action={action} className="space-y-3">
            <input type="hidden" name="retailerId" value={retailerId} />
            <input type="hidden" name="order" value={JSON.stringify(input)} />
            <label className="block text-[12px] text-ink-muted" htmlFor="po">PO number (optional)</label>
            <input id="po" name="poNumber" maxLength={40} className="h-10 w-full rounded-xl border border-lavender-100 bg-ivory px-3 text-[14px] outline-none" />
            <button
              type="submit"
              disabled={!canSubmit || pending || order.units === 0 || order.problems.length > 0}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-plum-700 font-medium text-white transition hover:bg-plum-800 disabled:opacity-40"
            >
              <Send size={16} aria-hidden="true" /> {pending ? "Placing order…" : "Place order"}
            </button>
            {!canSubmit && <p className="text-[12px] text-ink-muted">Ordering needs a Shopify B2B company. Download the CSV instead.</p>}
            {state.status === "error" && <p role="alert" className="text-[13px] text-[#8A4B0F]">{state.message}</p>}
          </form>
        )}
        <button
          type="button"
          onClick={downloadCsv}
          disabled={order.units === 0}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-lavender-100 text-sm text-ink transition hover:border-mauve-400 disabled:opacity-40"
        >
          <Download size={15} aria-hidden="true" /> Download as CSV
        </button>
        <p className="text-[11px] leading-relaxed text-ink-muted">
          Orders arrive as Shopify B2B draft orders on your payment terms. MSRP is a suggestion only: you set your own retail prices.
        </p>
      </aside>
    </div>
  );
}

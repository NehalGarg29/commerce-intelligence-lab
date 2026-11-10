"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Gift, ShoppingBag, Sparkles, Star } from "lucide-react";
import { addBundleAction, type BundleState } from "@/app/actions/cart";
import { BUNDLE_DISCOUNT_PCT, bundleTotals, type BundleOption } from "@/lib/bundle";
import { formatPrice } from "@/lib/format";
import { track } from "@/lib/analytics/track";

type Picks = { device: string | null; care: string | null; extra: string | null };

const STEPS = [
  { key: "device", n: 1, title: "Choose your device", sub: "The heart of the ritual." },
  { key: "care", n: 2, title: "Add glide & care", sub: "Comfort first. Incompatible options are greyed out." },
  { key: "extra", n: 3, title: "Pick an extra", sub: "Set the mood, or keep things tidy." },
] as const;

function OptionCard({
  o,
  selected,
  disabledReason,
  onPick,
}: {
  o: BundleOption;
  selected: boolean;
  disabledReason: string | null;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={!!disabledReason}
      aria-pressed={selected}
      title={disabledReason ?? undefined}
      className={`group relative flex w-full flex-col overflow-hidden rounded-2xl border bg-white text-left transition ${
        selected
          ? "border-plum-700 ring-2 ring-plum-700/30"
          : disabledReason
            ? "cursor-not-allowed border-lavender-100 opacity-45"
            : "border-lavender-100 hover:-translate-y-0.5 hover:border-mauve-400/60"
      }`}
    >
      <span className="relative block aspect-[4/3] bg-lavender-50">
        {o.imageUrl && <Image src={o.imageUrl} alt="" fill sizes="(min-width: 1024px) 220px, 45vw" className="object-cover" />}
        {selected && (
          <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-plum-700 text-white">
            <Check size={15} aria-hidden="true" />
          </span>
        )}
      </span>
      <span className="flex flex-1 flex-col p-3.5">
        <span className="text-[10px] tracking-[0.14em] text-ink-muted">{o.type.toUpperCase()}</span>
        <span className="mt-0.5 flex items-baseline justify-between gap-2">
          <span className="font-display text-[17px] text-ink">{o.title}</span>
          <span className="shrink-0 text-[13px] text-ink">{o.priceLabel}</span>
        </span>
        {o.rating && (
          <span className="mt-1 flex items-center gap-1 text-[12px] text-ink-muted">
            <Star size={11} className="text-plum-700" fill="currentColor" strokeWidth={0} aria-hidden="true" />
            {o.rating.average.toFixed(1)} ({o.rating.count})
          </span>
        )}
        {disabledReason && <span className="mt-1.5 text-[11px] leading-snug text-[#8A4B0F]">{disabledReason}</span>}
      </span>
    </button>
  );
}

export function BundleBuilder({
  devices,
  care,
  extras,
  initialDevice,
}: {
  devices: BundleOption[];
  care: BundleOption[];
  extras: BundleOption[];
  initialDevice: string | null;
}) {
  const [picks, setPicks] = useState<Picks>({
    device: devices.some((d) => d.handle === initialDevice) ? initialDevice : null,
    care: null,
    extra: null,
  });
  const [state, action, pending] = useActionState<BundleState, FormData>(addBundleAction, { status: "idle", message: "" });

  const byHandle = useMemo(() => new Map([...devices, ...care, ...extras].map((o) => [o.handle, o])), [devices, care, extras]);
  const device = picks.device ? byHandle.get(picks.device) : undefined;
  const chosen = [picks.device, picks.care, picks.extra].map((h) => (h ? byHandle.get(h) : undefined));
  const totals = bundleTotals(chosen.filter(Boolean).map((o) => o!.price));
  const complete = chosen.every(Boolean);

  // Mirrors the server rule: no silicone-based glide with a silicone device.
  const careBlock = (o: BundleOption) =>
    device?.silicone && o.silicone ? `Not recommended with ${device.title} (silicone). Choose a water-based glide.` : null;

  const pick = (slot: keyof Picks, handle: string) =>
    setPicks((p) => {
      const next = { ...p, [slot]: p[slot] === handle ? null : handle };
      // Changing the device can make the chosen glide incompatible.
      if (slot === "device" && next.care) {
        const d = next.device ? byHandle.get(next.device) : undefined;
        const c = byHandle.get(next.care);
        if (d?.silicone && c?.silicone) next.care = null;
      }
      return next;
    });

  useEffect(() => {
    if (state.status === "added") track("add_to_cart", { source: "ritual", count: 3 });
  }, [state]);

  const lists = { device: devices, care, extra: extras };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="min-w-0 space-y-12">
        {STEPS.map((s) => (
          <section key={s.key} aria-labelledby={`step-${s.key}`}>
            <div className="flex items-center gap-3">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-[14px] font-medium ${
                  picks[s.key] ? "bg-plum-700 text-white" : "bg-lavender-50 text-plum-800"
                }`}
              >
                {picks[s.key] ? <Check size={15} aria-hidden="true" /> : s.n}
              </span>
              <div>
                <h2 id={`step-${s.key}`} className="font-display text-2xl text-plum-800">{s.title}</h2>
                <p className="text-[13px] text-ink-muted">{s.sub}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {lists[s.key].map((o) => (
                <OptionCard
                  key={o.handle}
                  o={o}
                  selected={picks[s.key] === o.handle}
                  disabledReason={s.key === "care" ? careBlock(o) : null}
                  onPick={() => pick(s.key, o.handle)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <aside aria-label="Your ritual" className="rounded-3xl border border-lavender-100 bg-white p-6 lg:sticky lg:top-28">
        <p className="flex items-center gap-2 font-display text-xl text-ink">
          <Sparkles size={18} className="text-plum-700" aria-hidden="true" /> Your ritual
        </p>
        <ul className="mt-5 space-y-3">
          {STEPS.map((s, i) => {
            const o = chosen[i];
            return (
              <li key={s.key} className="flex items-center gap-3">
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-lavender-50">
                  {o?.imageUrl && <Image src={o.imageUrl} alt="" fill sizes="48px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] text-ink-muted">{s.n}. {s.title.replace(/^Choose your |^Add |^Pick an? /, "")}</span>
                  <span className={`block truncate text-[14px] ${o ? "text-ink" : "text-ink-muted/70"}`}>{o ? o.title : "Not chosen yet"}</span>
                </span>
                {o && <span className="text-[13px] tabular-nums">{o.priceLabel}</span>}
              </li>
            );
          })}
        </ul>

        <dl className="mt-5 space-y-1.5 border-t border-lavender-100 pt-4 text-[14px]">
          <div className="flex justify-between">
            <dt className="text-ink-muted">Subtotal</dt>
            <dd className="tabular-nums">{formatPrice(totals.subtotal)}</dd>
          </div>
          <div className={`flex justify-between ${complete ? "text-[#2F5D36]" : "text-ink-muted"}`}>
            <dt>Ritual bundle ({BUNDLE_DISCOUNT_PCT}% off)</dt>
            <dd className="tabular-nums">{complete ? `−${formatPrice(totals.savings)}` : "Pick all 3"}</dd>
          </div>
          <div className="flex justify-between border-t border-lavender-100 pt-2 text-[16px] font-medium">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatPrice(complete ? totals.total : totals.subtotal)}</dd>
          </div>
        </dl>

        {state.status === "added" ? (
          <div className="mt-5 space-y-3">
            <p role="status" className="flex items-start gap-2 rounded-2xl bg-[#E3F0E7] p-3.5 text-[14px] text-[#1F4D30]">
              <Check size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> {state.message}
            </p>
            <Link href="/cart" className="flex h-12 items-center justify-center gap-2 rounded-full bg-plum-700 font-medium text-white transition hover:bg-plum-800">
              <ShoppingBag size={16} aria-hidden="true" /> View bag
            </Link>
          </div>
        ) : (
          <form action={action} className="mt-5">
            <input type="hidden" name="device" value={picks.device ?? ""} />
            <input type="hidden" name="care" value={picks.care ?? ""} />
            <input type="hidden" name="extra" value={picks.extra ?? ""} />
            <button
              type="submit"
              disabled={!complete || pending}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-plum-700 font-medium text-white transition hover:bg-plum-800 disabled:opacity-40"
            >
              <ShoppingBag size={16} aria-hidden="true" /> {pending ? "Adding…" : complete ? "Add ritual to bag" : `Choose ${3 - chosen.filter(Boolean).length} more`}
            </button>
            {state.status === "error" && <p role="alert" className="mt-3 text-[13px] text-[#8A4B0F]">{state.message}</p>}
          </form>
        )}
        <p className="mt-4 flex items-start gap-2 text-[12px] leading-relaxed text-ink-muted">
          <Gift size={13} className="mt-0.5 shrink-0" aria-hidden="true" /> Ships together in plain packaging. Discount applied by
          Shopify at checkout.
        </p>
      </aside>
    </div>
  );
}

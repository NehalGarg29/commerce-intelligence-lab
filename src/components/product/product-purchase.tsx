"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import type { Variant } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";
import { SWATCHES } from "@/lib/catalog/compatibility";
import { addToBagAction, type AddToBagState } from "@/app/actions/cart";

const initial: AddToBagState = { status: "idle", message: "" };

function stockLine(v: Variant): { text: string; tone: string } {
  if (!v.available) return { text: "Out of stock in this option", tone: "text-[#9A2A2A]" };
  if (v.quantity !== null && v.quantity <= 5) return { text: `Only ${v.quantity} left`, tone: "text-[#8A4B0F]" };
  return { text: "In stock · ships in plain packaging", tone: "text-[#2F6B45]" };
}

export function ProductPurchase({ variants, giftNote = false }: { variants: Variant[]; giftNote?: boolean }) {
  const firstAvailable = variants.find((v) => v.available) ?? variants[0];
  const [variantId, setVariantId] = useState(firstAvailable.id);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [state, formAction, pending] = useActionState(addToBagAction, initial);

  const variant = variants.find((v) => v.id === variantId) ?? firstAvailable;
  const hasOptions = !(variants.length === 1 && variant.title === "Default Title");
  const optionName = variant.options[0]?.name ?? "Option";
  const maxQty = Math.min(10, variant.quantity ?? 10);
  const stock = stockLine(variant);
  const isColor = useMemo(() => /colou?r/i.test(optionName), [optionName]);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-3xl font-medium text-ink">{formatPrice(variant.price)}</p>

      {hasOptions && (
        <fieldset>
          <legend className="mb-3 text-sm text-ink">
            {optionName}: <span className="font-medium">{variant.options[0]?.value}</span>
          </legend>
          <div className="flex flex-wrap gap-3">
            {variants.map((v) => {
              const value = v.options[0]?.value ?? v.title;
              const selected = v.id === variantId;
              const swatch = SWATCHES[value.toLowerCase()];
              return isColor && swatch ? (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setVariantId(v.id);
                    setQty(1);
                  }}
                  aria-label={`${value}${v.available ? "" : " (out of stock)"}`}
                  aria-pressed={selected}
                  className={`relative h-11 w-11 rounded-full border transition ${
                    selected ? "ring-2 ring-plum-700 ring-offset-2 ring-offset-ivory" : "border-black/10"
                  } ${v.available ? "" : "opacity-40"}`}
                  style={{ backgroundColor: swatch }}
                >
                  {!v.available && (
                    <span aria-hidden="true" className="absolute left-1/2 top-1/2 h-px w-12 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-ink" />
                  )}
                </button>
              ) : (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setVariantId(v.id);
                    setQty(1);
                  }}
                  aria-pressed={selected}
                  className={`h-11 rounded-full border px-5 text-sm transition ${
                    selected ? "border-plum-700 bg-plum-700 text-white" : "border-lavender-100 bg-white text-ink"
                  } ${v.available ? "" : "text-ink-muted line-through"}`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <p className={`text-sm ${stock.tone}`}>{stock.text}</p>

      {giftNote && (
        <div>
          <label htmlFor="gift-note" className="text-sm text-ink">
            Your note <span className="text-ink-muted">(printed on the card, optional)</span>
          </label>
          <textarea
            id="gift-note"
            form="add-to-bag"
            name="giftNote"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 150))}
            rows={3}
            maxLength={150}
            placeholder="Only for you. Happy anniversary."
            className="mt-2 w-full resize-none rounded-2xl border border-lavender-100 bg-white px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-ink-muted/60 focus:border-plum-700"
          />
          <p className="mt-1 text-right text-xs text-ink-muted">{note.length}/150</p>
        </div>
      )}

      <form id="add-to-bag" action={formAction} className="flex flex-col gap-3 sm:flex-row">
        <input type="hidden" name="variantId" value={variant.id} />
        <input type="hidden" name="quantity" value={qty} />
        <div className="flex h-14 items-center justify-between rounded-full border border-lavender-100 bg-white px-2 sm:w-36">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Decrease quantity"
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-lavender-50 disabled:opacity-30"
          >
            <Minus size={16} />
          </button>
          <span aria-live="polite" className="w-6 text-center text-[15px]">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            disabled={qty >= maxQty}
            aria-label="Increase quantity"
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-lavender-50 disabled:opacity-30"
          >
            <Plus size={16} />
          </button>
        </div>
        <button
          type="submit"
          disabled={!variant.available || pending}
          className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-plum-700 px-8 font-medium text-white transition hover:bg-plum-800 disabled:cursor-not-allowed disabled:bg-mauve-400"
        >
          <ShoppingBag size={18} aria-hidden="true" />
          {!variant.available ? "Out of stock" : pending ? "Adding…" : `Add to bag · ${formatPrice(variant.price * qty)}`}
        </button>
      </form>

      <div aria-live="polite" className="min-h-6 text-sm">
        {state.status === "added" && (
          <p className="flex items-center gap-2 text-[#2F6B45]">
            <Check size={16} aria-hidden="true" /> {state.message}{" "}
            <Link href="/cart" className="font-medium text-plum-700 underline underline-offset-4">View bag</Link>
          </p>
        )}
        {state.status === "error" && <p className="text-[#9A2A2A]">{state.message}</p>}
      </div>
    </div>
  );
}

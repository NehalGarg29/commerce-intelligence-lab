import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Gift, Lock, Minus, Package, PenLine, Plus, X, Sparkles } from "lucide-react";
import { getCart } from "@/lib/cart";
import { productImageSrc } from "@/lib/catalog/local-images";
import { formatPrice } from "@/lib/format";
import { removeLineAction, updateLineAction } from "@/app/actions/cart";
import { AskAdvisorButton } from "@/components/advisor/ask-advisor-button";
import { CheckoutLink } from "@/components/analytics/checkout-link";

export const metadata: Metadata = { title: "Your bag · Lumen Atelier" };

async function CartView() {
  const cart = await getCart();

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="rounded-3xl border border-lavender-100 bg-white px-8 py-20 text-center">
        <p className="font-display text-4xl text-plum-800">Your bag is empty</p>
        <p className="mx-auto mt-3 max-w-md text-ink-muted">Browse the collection, or let the advisor narrow it down for you.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="inline-flex h-12 items-center rounded-full bg-plum-700 px-7 font-medium text-white">Shop the collection</Link>
          <AskAdvisorButton className="inline-flex h-12 items-center rounded-full border border-plum-700 px-7 font-medium text-plum-700">Ask the advisor</AskAdvisorButton>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <ul className="divide-y divide-lavender-100 border-y border-lavender-100" aria-label="Items in your bag">
        {cart.lines.map((line) => {
          const src = productImageSrc(line.product.handle, line.product.imageUrl);
          const maxQty = Math.min(10, line.quantityAvailable ?? 10);
          return (
            <li key={line.id} className="flex gap-5 py-6">
              <Link href={`/products/${line.product.handle}`} className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-lavender-50">
                {src && <Image src={src} alt={line.product.title} fill sizes="112px" className="object-cover" />}
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="text-[11px] tracking-[0.16em] text-ink-muted">{line.product.brand.toUpperCase()}</p>
                    <Link href={`/products/${line.product.handle}`} className="font-display text-xl text-ink hover:text-plum-700">
                      {line.product.title}
                    </Link>
                    {line.variantTitle !== "Default Title" && <p className="text-sm text-ink-muted">{line.variantTitle}</p>}
                    {line.bundle && (
                      <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-lavender-50 px-2.5 py-0.5 text-[11px] text-plum-800">
                        <Sparkles size={11} aria-hidden="true" /> Ritual bundle
                      </p>
                    )}
                    {line.giftNote && (
                      <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-lavender-50 px-3 py-2 text-[13px] italic text-plum-800">
                        <PenLine size={13} className="mt-0.5 shrink-0 not-italic" aria-hidden="true" /> “{line.giftNote}”
                      </p>
                    )}
                  </div>
                  <p className="text-[15px] text-ink">{formatPrice(line.lineTotal)}</p>
                </div>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <div className="flex h-10 items-center rounded-full border border-lavender-100 bg-white">
                    <form action={updateLineAction}>
                      <input type="hidden" name="lineId" value={line.id} />
                      <input type="hidden" name="quantity" value={line.quantity - 1} />
                      <button type="submit" aria-label={`Decrease ${line.product.title} quantity`} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-lavender-50">
                        <Minus size={14} />
                      </button>
                    </form>
                    <span className="w-6 text-center text-sm" aria-label={`Quantity ${line.quantity}`}>{line.quantity}</span>
                    <form action={updateLineAction}>
                      <input type="hidden" name="lineId" value={line.id} />
                      <input type="hidden" name="quantity" value={line.quantity + 1} />
                      <button type="submit" disabled={line.quantity >= maxQty} aria-label={`Increase ${line.product.title} quantity`} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-lavender-50 disabled:opacity-30">
                        <Plus size={14} />
                      </button>
                    </form>
                  </div>
                  <form action={removeLineAction}>
                    <input type="hidden" name="lineId" value={line.id} />
                    <button type="submit" className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-plum-700">
                      <X size={14} aria-hidden="true" /> Remove
                    </button>
                  </form>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <aside className="h-fit rounded-3xl border border-lavender-100 bg-white p-7">
        <h2 className="font-display text-2xl text-plum-800">Summary</h2>
        <dl className="mt-6 space-y-3 text-[15px]">
          <div className="flex justify-between"><dt className="text-ink-muted">Subtotal</dt><dd>{formatPrice(cart.subtotal)}</dd></div>
          {cart.discountCodes.filter((d) => d.applicable).map((d) => (
            <div key={d.code} className="flex justify-between text-[#2F5D36]">
              <dt>Discount · {d.code}</dt>
              <dd>{cart.total < cart.subtotal ? `−${formatPrice(Math.round((cart.subtotal - cart.total) * 100) / 100)}` : "Applied"}</dd>
            </div>
          ))}
          <div className="flex justify-between"><dt className="text-ink-muted">Shipping and taxes</dt><dd className="text-ink-muted">At checkout</dd></div>
        </dl>
        <CheckoutLink
          href={cart.checkoutUrl}
          className="mt-7 flex h-14 items-center justify-center gap-2 rounded-full bg-plum-700 font-medium text-white transition hover:bg-plum-800"
        >
          <Lock size={16} aria-hidden="true" /> Checkout securely
        </CheckoutLink>
        {!cart.lines.some((l) => l.product.handle === "only-for-you-gift-box") && (
          <Link
            href="/products/only-for-you-gift-box"
            className="mt-4 flex items-center gap-3 rounded-2xl border border-dashed border-mauve-400/60 p-4 text-[14px] text-ink transition hover:border-plum-700"
          >
            <Gift size={20} className="shrink-0 text-plum-700" aria-hidden="true" />
            <span>
              <span className="font-medium">Make it a gift</span>
              <br />
              <span className="text-ink-muted">Add the Only For You box with a personal note.</span>
            </span>
          </Link>
        )}
        <p className="mt-4 flex items-start gap-2 text-[13px] leading-relaxed text-ink-muted">
          <Package size={15} className="mt-0.5 shrink-0 text-plum-700" aria-hidden="true" />
          Payment happens on Shopify&apos;s own checkout. This is a development store, so no real payment is taken.
        </p>
      </aside>
    </div>
  );
}

export default function CartPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 pb-10 pt-10 md:px-12 md:pt-14">
      <h1 className="font-display text-4xl tracking-tight text-plum-800 md:text-5xl">Your bag</h1>
      <div className="mt-8">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-lavender-100/50" />}>
          <CartView />
        </Suspense>
      </div>
    </main>
  );
}

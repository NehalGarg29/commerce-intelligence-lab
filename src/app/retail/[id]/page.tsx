import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FlaskConical, Info } from "lucide-react";
import { getProducts } from "@/lib/catalog";
import { productImageSrc } from "@/lib/catalog/local-images";
import { formatPrice } from "@/lib/format";
import { getRetailer } from "@/lib/b2b/retailers";
import { describeAdjustment, retailMargin, wholesalePrice } from "@/lib/b2b/pricing";
import { getDemand } from "@/lib/b2b/demand";
import { recommendAssortment } from "@/lib/b2b/recommend";
import { OrderBuilder, type OrderRow } from "@/components/b2b/order-builder";
import { canViewRetailer } from "@/lib/auth/session";

type Params = Promise<{ id: string }>;

export const metadata: Metadata = { title: "Retail portal · Lumen Atelier", robots: { index: false, follow: false } };

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-3xl border border-lavender-100 bg-white p-6">
      <p className="text-[12px] text-ink-muted">{label}</p>
      <p className="mt-2 font-display text-3xl tracking-tight text-plum-800">{value}</p>
      {note && <p className="mt-1 text-[12px] text-ink-muted">{note}</p>}
    </div>
  );
}

function NoAccess({ own }: { own: string }) {
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-lavender-100 bg-white p-10 text-center">
      <p className="font-display text-3xl text-plum-800">This isn&apos;t your portal</p>
      <p className="mt-3 text-[15px] text-ink-muted">Retail partners can only see their own company&apos;s prices and recommendations.</p>
      <Link href={own} className="mt-7 inline-flex h-11 items-center rounded-full bg-plum-700 px-6 text-sm font-medium text-white">
        Go to your portal
      </Link>
    </div>
  );
}

async function Portal({ params }: { params: Params }) {
  const { id } = await params;
  const { session, allowed } = await canViewRetailer(id);
  if (!session) redirect(`/signin?next=/retail/${encodeURIComponent(id)}`);
  if (!allowed) return <NoAccess own={session.role === "retailer" ? `/retail/${session.locationId}` : "/retail"} />;
  const [retailer, products, demand] = await Promise.all([getRetailer(id), getProducts(), getDemand()]);
  if (!retailer) notFound();

  const list = retailer.priceList;
  // Wholesale price of a product = its first variant through the retailer's price list.
  const priced = products
    .filter((p) => !p.tags.includes("gift-box") && p.variants.length > 0)
    .map((p) => {
      const v = p.variants.find((x) => x.available) ?? p.variants[0];
      const wholesale = wholesalePrice(v.id, v.price, list);
      return { p, retail: v.price, wholesale, margin: retailMargin(v.price, wholesale) };
    });
  const byHandle = new Map(priced.map((x) => [x.p.handle, x]));

  const suggestions = recommendAssortment(products, demand, 8);
  const rows: OrderRow[] = suggestions.flatMap((s) => {
    const x = byHandle.get(s.product.handle);
    if (!x) return [];
    return [{
      handle: s.product.handle,
      title: s.product.title,
      brand: s.product.brand,
      imageUrl: productImageSrc(s.product.handle, s.product.imageUrl),
      retail: x.retail,
      wholesale: x.wholesale,
      margin: x.margin,
      stock: s.product.totalInventory,
      score: s.score,
      suggestedUnits: s.suggestedUnits,
      reasons: s.reasons,
    }];
  });

  const avgMargin = priced.reduce((s, x) => s + x.margin, 0) / Math.max(1, priced.length);
  const inStock = priced.filter((x) => x.p.available).length;
  const lowStock = priced.filter((x) => x.p.available && x.p.totalInventory !== null && x.p.totalInventory <= 5).length;

  return (
    <>
      {session.role === "merchant" && (
        <Link href="/retail" className="text-[13px] text-ink-muted hover:text-plum-700">← All retail partners</Link>
      )}
      <p className="mt-6 text-[11px] tracking-[0.2em] text-ink-muted">RETAIL PARTNER PORTAL</p>
      <h1 className="mt-3 font-display text-5xl tracking-tight text-plum-800">{retailer.company}</h1>
      <p className="mt-2 text-[15px] text-ink-muted">
        {retailer.location}
        {retailer.city ? ` · ${retailer.city}` : ""}
        {retailer.paymentTerms ? ` · ${retailer.paymentTerms}` : ""}
        {retailer.catalog ? ` · Catalog: ${retailer.catalog}` : ""}
      </p>
      {retailer.source === "demo" && (
        <p className="mt-5 flex items-start gap-2 rounded-2xl bg-[#FBEADD] px-4 py-3 text-[13px] text-[#8A4B0F]">
          <FlaskConical size={15} className="mt-0.5 shrink-0" aria-hidden="true" /> Demo retailer. Connect Shopify B2B to use real
          companies and price lists; products, prices and stock below are already live.
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Your pricing" value={describeAdjustment(list.adjustment)} note={`${Object.keys(list.fixedPrices).length} fixed prices`} />
        <Tile label="Average margin at retail price" value={`${Math.round(avgMargin * 100)}%`} />
        <Tile label="Products available" value={String(inStock)} note={`of ${priced.length} in the range`} />
        <Tile label="Low stock at the brand" value={String(lowStock)} note="5 units or fewer" />
      </div>

      <section className="mt-14">
        <h2 className="font-display text-3xl tracking-tight text-plum-800">Recommended to stock</h2>
        <p className="mt-2 flex items-start gap-2 text-[14px] text-ink-muted">
          <Info size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          Ranked by what shoppers view and add to bag on our own storefront (last 14 days) and by review rating. Quantities
          are suggestions, capped by our live stock.
        </p>
        <div className="mt-6">
          <OrderBuilder rows={rows} retailer={retailer.company} currency={list.currency} />
        </div>
      </section>

      <section className="mt-14 overflow-x-auto rounded-3xl border border-lavender-100 bg-white">
        <table className="w-full min-w-[640px] text-[14px]">
          <caption className="px-6 pt-6 text-left font-display text-2xl text-ink">Full wholesale price list</caption>
          <thead>
            <tr className="border-b border-lavender-100 text-left text-[12px] text-ink-muted">
              <th className="px-6 py-3 font-normal">Product</th>
              <th className="px-6 py-3 text-right font-normal">Retail</th>
              <th className="px-6 py-3 text-right font-normal">Your price</th>
              <th className="px-6 py-3 text-right font-normal">Margin</th>
              <th className="px-6 py-3 font-normal">Availability</th>
              <th className="px-6 py-3 font-normal"><span className="sr-only">Kit</span></th>
            </tr>
          </thead>
          <tbody>
            {priced.map(({ p, retail, wholesale, margin }) => (
              <tr key={p.handle} className="border-b border-lavender-100 last:border-0">
                <td className="px-6 py-3 text-ink">
                  {p.title} <span className="text-ink-muted">· {p.brand}</span>
                </td>
                <td className="px-6 py-3 text-right tabular-nums">{formatPrice(retail)}</td>
                <td className="px-6 py-3 text-right tabular-nums text-ink">{formatPrice(wholesale)}</td>
                <td className="px-6 py-3 text-right tabular-nums">{Math.round(margin * 100)}%</td>
                <td className="px-6 py-3 text-ink-muted">
                  {!p.available ? "Sold out" : p.totalInventory !== null && p.totalInventory <= 5 ? `Low · ${p.totalInventory} left` : "In stock"}
                </td>
                <td className="px-6 py-3 text-right">
                  <Link href={`/retail/kit/${p.handle}`} className="text-[13px] text-plum-800 underline-offset-4 hover:underline">Kit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

export default function RetailerPortalPage({ params }: { params: Params }) {
  return (
    <main className="mx-auto max-w-7xl px-5 pb-16 pt-10 md:px-12 md:pt-14">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-lavender-100/60" />}>
        <Portal params={params} />
      </Suspense>
    </main>
  );
}

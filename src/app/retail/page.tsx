import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, FlaskConical } from "lucide-react";
import { listRetailers } from "@/lib/b2b/retailers";
import { describeAdjustment } from "@/lib/b2b/pricing";
import { redirect } from "next/navigation";
import { requireSignedIn } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Retail partners · Lumen Atelier",
  robots: { index: false, follow: false },
};

async function RetailerList() {
  const session = await requireSignedIn("/retail");
  if (session.role === "retailer") redirect(`/retail/${session.locationId}`);
  const { retailers, source, error } = await listRetailers();
  return (
    <>
      {source === "demo" && (
        <p className="mt-8 flex items-start gap-2 rounded-2xl bg-[#FBEADD] px-4 py-3 text-[13px] text-[#8A4B0F]">
          <FlaskConical size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          {error ?? "Shopify B2B isn't connected yet, so these are demo retailers."} Prices, stock and products are still live from Shopify.
        </p>
      )}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {retailers.map((r) => (
          <Link
            key={r.id}
            href={`/retail/${r.id}`}
            className="group flex flex-col rounded-3xl border border-lavender-100 bg-white p-7 transition hover:-translate-y-0.5 hover:border-mauve-400/60 hover:shadow-[0_12px_30px_-18px_rgba(46,15,41,0.35)]"
          >
            <Building2 size={22} className="text-plum-700" aria-hidden="true" />
            <p className="mt-4 font-display text-2xl text-ink group-hover:text-plum-700">{r.company}</p>
            <p className="mt-1 text-[14px] text-ink-muted">
              {r.location}
              {r.city ? ` · ${r.city}` : ""}
            </p>
            <dl className="mt-5 flex flex-wrap gap-2 text-[12px]">
              <dd className="rounded-full bg-lavender-50 px-3 py-1 text-plum-800">{describeAdjustment(r.priceList.adjustment)}</dd>
              {r.paymentTerms && <dd className="rounded-full bg-lavender-50 px-3 py-1 text-plum-800">{r.paymentTerms}</dd>}
              {r.catalog && <dd className="rounded-full bg-lavender-50 px-3 py-1 text-plum-800">{r.catalog}</dd>}
            </dl>
            <span className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-plum-800">
              Open portal (demo sign-in) <ArrowRight size={15} className="transition group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}

export default function RetailPage() {
  return (
    <main className="mx-auto max-w-7xl px-5 pb-16 pt-10 md:px-12 md:pt-14">
      <p className="text-[11px] tracking-[0.2em] text-ink-muted">B2B · SHOPIFY PLUS</p>
      <h1 className="mt-3 font-display text-5xl tracking-tight text-plum-800 md:text-6xl">Retail partner portal</h1>
      <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-ink-muted">
        For the shops that stock our brands: their wholesale prices from Shopify B2B, live availability, what to stock
        based on what shoppers want right now, and approved marketing kits.
      </p>
      <Suspense fallback={<div className="mt-8 h-56 animate-pulse rounded-3xl bg-lavender-100/60" />}>
        <RetailerList />
      </Suspense>
      <p className="mt-6 text-[12px] text-ink-muted">
        Merchant view: every retail partner. Buyers who sign in only ever see their own company. In production they would log in with Shopify customer accounts for B2B.
      </p>
    </main>
  );
}

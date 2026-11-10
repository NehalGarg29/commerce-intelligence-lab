import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Check, Minus, Sparkles, X } from "lucide-react";
import { getProducts } from "@/lib/catalog";
import type { Product } from "@/lib/catalog/types";
import { FEATURE_LABELS } from "@/lib/catalog/attributes";
import { AUDIENCES } from "@/lib/catalog/filters";
import { careAdvice } from "@/lib/catalog/compatibility";
import { productImageSrc } from "@/lib/catalog/local-images";
import { formatPrice } from "@/lib/format";
import { getReviewIntel } from "@/lib/reviews";
import { themeVerdict } from "@/lib/reviews/analyze";
import { RatingInline } from "@/components/reviews/stars";
import { AskAdvisorButton } from "@/components/advisor/ask-advisor-button";

export const metadata: Metadata = { title: "Compare · Lumen Atelier" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const HANDLE = /^[a-z0-9-]{1,80}$/;
const COMPARE_FEATURES = [
  "beginner-friendly",
  "whisper-quiet",
  "waterproof",
  "travel-size",
  "rechargeable",
  "app-free",
  "warming",
  "body-safe-silicone",
];

function parseHandles(raw: string | string[] | undefined): string[] {
  const value = Array.isArray(raw) ? raw.join(",") : raw ?? "";
  return [...new Set(value.split(",").map((h) => h.trim()).filter((h) => HANDLE.test(h)))].slice(0, 3);
}

function stockSummary(p: Product): { text: string; tone: string } {
  if (!p.available) return { text: "Sold out", tone: "text-[#9A2A2A]" };
  const inStock = p.variants.filter((v) => v.available);
  const low = p.totalInventory !== null && p.totalInventory <= 5;
  if (inStock.length < p.variants.length) {
    return { text: `${inStock.length} of ${p.variants.length} options in stock`, tone: "text-[#8A4B0F]" };
  }
  return low ? { text: `Only ${p.totalInventory} left`, tone: "text-[#8A4B0F]" } : { text: "In stock", tone: "text-[#2F6B45]" };
}

function Row({ label, cells, differs }: { label: string; cells: React.ReactNode[]; differs?: boolean }) {
  return (
    <tr className="border-t border-lavender-100 align-top">
      <th scope="row" className="w-44 py-4 pr-4 text-left text-[13px] font-normal text-ink-muted">
        {label}
        {differs && <span className="ml-1.5 rounded-full bg-lavender-50 px-1.5 py-0.5 text-[10px] text-plum-800">differs</span>}
      </th>
      {cells.map((c, i) => (
        <td key={i} className="px-4 py-4 text-[15px] text-ink">{c}</td>
      ))}
    </tr>
  );
}

async function CompareView({ searchParams }: { searchParams: SearchParams }) {
  const handles = parseHandles((await searchParams).items);
  const [all, intel] = await Promise.all([getProducts(), getReviewIntel()]);
  const products = handles.map((h) => all.find((p) => p.handle === h)).filter((p): p is Product => !!p);

  if (products.length < 2) {
    return (
      <div className="rounded-3xl border border-lavender-100 bg-white px-8 py-16 text-center">
        <p className="font-display text-3xl text-plum-800">Pick two or three products to compare</p>
        <p className="mx-auto mt-3 max-w-md text-ink-muted">
          Tap <span className="font-medium text-ink">+ Compare</span> on any product card, then open the compare bar at the bottom of the screen.
        </p>
        <Link href="/shop" className="mt-8 inline-flex h-12 items-center rounded-full bg-plum-700 px-7 font-medium text-white">
          Browse the collection
        </Link>
      </div>
    );
  }

  const without = (handle: string) => `/compare?items=${products.filter((p) => p.handle !== handle).map((p) => p.handle).join(",")}`;
  const cheapest = Math.min(...products.map((p) => p.priceMin));
  const differs = (values: string[]) => new Set(values).size > 1;

  const priceCells = products.map((p) => (
    <span key={p.id}>
      {formatPrice(p.priceMin, p.priceMax)}
      {p.priceMin === cheapest && <span className="ml-2 rounded-full bg-[#E3F0E7] px-2 py-0.5 text-[11px] text-[#1F4D30]">Lowest</span>}
    </span>
  ));
  const audienceText = (p: Product) =>
    Object.keys(AUDIENCES).filter((a) => p.tags.includes(a)).map((a) => AUDIENCES[a]).join(", ") || "Everyone";
  const optionText = (p: Product) =>
    p.variants.length === 1 && p.variants[0].title === "Default Title" ? "One option" : p.variants.map((v) => v.title).join(", ");
  const bestRated = Math.max(...products.map((p) => p.rating?.average ?? 0));
  const reviewCells = products.map((p) => {
    if (!p.rating) return <span key={p.id} className="text-ink-muted">No reviews yet</span>;
    const praised = (intel[p.handle]?.themes ?? [])
      .filter((t) => themeVerdict(t) === "praised")
      .slice(0, 2)
      .map((t) => t.label);
    return (
      <div key={p.id} className="flex flex-col gap-1.5">
        <span className="flex flex-wrap items-center gap-2">
          <a href={`/products/${p.handle}#reviews`} className="hover:opacity-80">
            <RatingInline average={p.rating.average} count={p.rating.count} />
          </a>
          {products.length > 1 && p.rating.average === bestRated && (
            <span className="rounded-full bg-[#E3F0E7] px-2 py-0.5 text-[11px] text-[#1F4D30]">Top rated</span>
          )}
        </span>
        {praised.length > 0 && <span className="text-[13px] text-ink-muted">Praised for: {praised.join(", ")}</span>}
      </div>
    );
  });
  const pairingText = (p: Product) => {
    const advice = careAdvice(p);
    if (!advice) return "Not applicable";
    return advice.avoid ? "Water-based only (not silicone-based)" : "Any water-based lubricant";
  };

  return (
    <div className="overflow-x-auto rounded-3xl border border-lavender-100 bg-white">
      <table className="w-full min-w-[720px] border-collapse">
        <caption className="sr-only">Side-by-side comparison of {products.map((p) => p.title).join(", ")}</caption>
        <thead>
          <tr>
            <td className="w-44 p-4" />
            {products.map((p) => {
              const src = productImageSrc(p.handle, p.imageUrl);
              return (
                <th key={p.id} scope="col" className="relative p-4 text-left align-top font-normal">
                  <Link
                    href={without(p.handle)}
                    aria-label={`Remove ${p.title} from comparison`}
                    className="absolute right-6 top-6 z-10 rounded-full bg-white/90 p-1.5 text-ink-muted shadow-sm hover:text-plum-700"
                  >
                    <X size={14} />
                  </Link>
                  <Link href={`/products/${p.handle}`} className="group block">
                    <div className="relative aspect-square overflow-hidden rounded-2xl bg-lavender-50">
                      {src && <Image src={src} alt={p.title} fill sizes="260px" className="object-cover transition duration-500 group-hover:scale-105" />}
                    </div>
                    <p className="mt-4 text-[11px] tracking-[0.16em] text-ink-muted">{p.brand.toUpperCase()}</p>
                    <p className="mt-1 font-display text-2xl text-ink group-hover:text-plum-700">{p.title}</p>
                  </Link>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          <Row label="Price" cells={priceCells} differs={differs(products.map((p) => String(p.priceMin)))} />
          <Row label="Type" cells={products.map((p) => p.type)} differs={differs(products.map((p) => p.type))} />
          <Row label="Made for" cells={products.map(audienceText)} differs={differs(products.map(audienceText))} />
          <Row
            label="Availability"
            cells={products.map((p) => {
              const s = stockSummary(p);
              return <span key={p.id} className={s.tone}>{s.text}</span>;
            })}
          />
          <Row label="Options" cells={products.map(optionText)} />
          {COMPARE_FEATURES.filter((f) => products.some((p) => p.tags.includes(f))).map((f) => (
            <Row
              key={f}
              label={FEATURE_LABELS[f]}
              differs={differs(products.map((p) => String(p.tags.includes(f))))}
              cells={products.map((p) =>
                p.tags.includes(f) ? (
                  <Check key={p.id} size={18} className="text-[#2F6B45]" aria-label="Yes" />
                ) : (
                  <Minus key={p.id} size={18} className="text-ink-muted/50" aria-label="No" />
                )
              )}
            />
          ))}
          <Row label="Lubricant pairing" cells={products.map(pairingText)} differs={differs(products.map(pairingText))} />
          <Row label="Reviews (demo)" cells={reviewCells} />
          <tr className="border-t border-lavender-100">
            <td className="p-4" />
            {products.map((p) => (
              <td key={p.id} className="p-4">
                <Link
                  href={`/products/${p.handle}`}
                  className="flex h-11 items-center justify-center rounded-full bg-plum-700 px-5 text-sm font-medium text-white transition hover:bg-plum-800"
                >
                  {p.available ? "Choose options" : "View product"}
                </Link>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function ComparePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto max-w-6xl px-5 pb-10 pt-10 md:px-12 md:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.2em] text-ink-muted">SIDE BY SIDE</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight text-plum-800 md:text-5xl">Compare</h1>
          <p className="mt-2 text-[15px] text-ink-muted">Prices, stock and features come live from Shopify; reviews are fictional demo data. Rows that differ are marked.</p>
        </div>
        <AskAdvisorButton className="inline-flex h-11 items-center gap-2 rounded-full border border-plum-700 px-5 text-sm font-medium text-plum-700">
          <Sparkles size={15} aria-hidden="true" /> Still unsure? Ask the advisor
        </AskAdvisorButton>
      </div>
      <div className="mt-8">
        <Suspense fallback={<div className="h-[600px] animate-pulse rounded-3xl bg-lavender-100/50" />}>
          <CompareView searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

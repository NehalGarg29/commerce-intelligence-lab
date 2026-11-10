import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { getProducts } from "@/lib/catalog";
import { FEATURE_LABELS } from "@/lib/catalog/attributes";
import {
  AUDIENCES,
  DEFAULT_FILTERS,
  SORTS,
  activeFilterCount,
  applyFilters,
  brandName,
  pageTitle,
  parseShopParams,
  shopHref,
  type ShopFilters,
  type SortKey,
} from "@/lib/catalog/filters";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { FilterSidebar } from "@/components/shop/filter-sidebar";
import { SortSelect } from "@/components/shop/sort-select";

export const metadata: Metadata = {
  title: "Shop · Lumen Atelier",
  description: "Browse the full collection with live prices and stock.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function activeChips(f: ShopFilters): { label: string; href: string }[] {
  const chips: { label: string; href: string }[] = [];
  if (f.q) chips.push({ label: `“${f.q}”`, href: shopHref(f, { q: "" }) });
  if (f.audience) chips.push({ label: AUDIENCES[f.audience], href: shopHref(f, { audience: null }) });
  if (f.category) chips.push({ label: "Care", href: shopHref(f, { category: null }) });
  if (f.brand) chips.push({ label: brandName(f.brand), href: shopHref(f, { brand: null }) });
  for (const t of f.tags) {
    chips.push({ label: FEATURE_LABELS[t], href: shopHref(f, { tags: f.tags.filter((x) => x !== t) }) });
  }
  if (f.maxPrice !== null) chips.push({ label: `Under $${f.maxPrice}`, href: shopHref(f, { maxPrice: null }) });
  if (f.inStock) chips.push({ label: "In stock", href: shopHref(f, { inStock: false }) });
  return chips;
}

function SearchBox({ f }: { f: ShopFilters }) {
  // A plain GET form: works without JavaScript, keeps every other filter.
  return (
    <form action="/shop" method="get" role="search" className="relative w-full max-w-md">
      <label htmlFor="shop-q" className="sr-only">Search products</label>
      <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
      <input
        id="shop-q"
        name="q"
        type="search"
        defaultValue={f.q}
        placeholder="Search “quiet”, “travel”, “silicone”…"
        className="h-12 w-full rounded-full border border-lavender-100 bg-white pl-11 pr-4 text-[15px] text-ink outline-none transition placeholder:text-ink-muted/70 focus:border-plum-700"
      />
      {f.audience && <input type="hidden" name="audience" value={f.audience} />}
      {f.category && <input type="hidden" name="category" value={f.category} />}
      {f.brand && <input type="hidden" name="brand" value={f.brand} />}
      {f.tags.length > 0 && <input type="hidden" name="tag" value={f.tags.join(",")} />}
      {f.maxPrice !== null && <input type="hidden" name="maxPrice" value={f.maxPrice} />}
      {f.inStock && <input type="hidden" name="inStock" value="1" />}
      {f.sort !== "featured" && <input type="hidden" name="sort" value={f.sort} />}
    </form>
  );
}

async function ShopResults({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseShopParams(await searchParams);
  const products = await getProducts();
  const results = applyFilters(products, filters);
  const { title, subtitle } = pageTitle(filters);
  const chips = activeChips(filters);
  const nActive = activeFilterCount(filters);
  const sortHrefs = Object.fromEntries(
    (Object.keys(SORTS) as SortKey[]).map((k) => [k, shopHref(filters, { sort: k })])
  ) as Record<SortKey, string>;

  return (
    <>
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <nav aria-label="Breadcrumb" className="text-[13px] text-ink-muted">
            <Link href="/" className="hover:text-plum-700">Home</Link> <span aria-hidden="true">/</span>{" "}
            <Link href="/shop" className="hover:text-plum-700">Shop</Link>
          </nav>
          <h1 className="mt-3 font-display text-4xl tracking-tight text-plum-800 md:text-5xl">{title}</h1>
          <p className="mt-2 text-[15px] text-ink-muted">{subtitle}</p>
        </div>
        <SearchBox f={filters} />
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[240px_1fr]">
        {/* Desktop sidebar */}
        <aside aria-label="Filters" className="hidden lg:block">
          <FilterSidebar products={products} filters={filters} />
        </aside>

        <section aria-label="Products">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-muted" aria-live="polite">
              {results.length} {results.length === 1 ? "product" : "products"}
            </p>
            <div className="flex items-center gap-2">
              {/* Mobile filter drawer: native <details>, no JavaScript needed */}
              <details className="group relative lg:hidden">
                <summary className="flex h-11 cursor-pointer list-none items-center gap-2 rounded-full border border-lavender-100 bg-white px-4 text-sm text-ink">
                  <SlidersHorizontal size={16} aria-hidden="true" /> Filters{nActive > 0 && ` (${nActive})`}
                </summary>
                <div className="absolute right-0 z-30 mt-2 max-h-[70vh] w-[min(320px,85vw)] overflow-y-auto rounded-2xl border border-lavender-100 bg-ivory p-5 shadow-2xl shadow-plum-900/15">
                  <FilterSidebar products={products} filters={filters} />
                </div>
              </details>
              <SortSelect value={filters.sort} hrefs={sortHrefs} />
            </div>
          </div>

          {chips.length > 0 && (
            <ul className="mt-4 flex flex-wrap items-center gap-2" aria-label="Active filters">
              {chips.map((c) => (
                <li key={c.label}>
                  <Link
                    href={c.href}
                    scroll={false}
                    className="inline-flex items-center gap-1.5 rounded-full bg-lavender-50 px-3 py-1.5 text-sm text-plum-800 transition hover:bg-lavender-100"
                    aria-label={`Remove filter ${c.label}`}
                  >
                    {c.label} <X size={14} aria-hidden="true" />
                  </Link>
                </li>
              ))}
              <li>
                <Link href={shopHref(DEFAULT_FILTERS, { sort: filters.sort })} scroll={false} className="px-2 text-sm text-ink-muted underline-offset-4 hover:text-plum-700 hover:underline">
                  Clear all
                </Link>
              </li>
            </ul>
          )}

          {results.length > 0 ? (
            <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-3xl border border-lavender-100 bg-white px-8 py-16 text-center">
              <p className="font-display text-3xl text-plum-800">Nothing matches all of that</p>
              <p className="mx-auto mt-3 max-w-md text-ink-muted">
                Try removing a filter, or tell the advisor what you need and it will show the closest in-stock options.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/shop" className="inline-flex h-11 items-center rounded-full border border-plum-700 px-6 text-sm font-medium text-plum-700">
                  Clear all filters
                </Link>
                <Link href="/advisor" className="inline-flex h-11 items-center gap-2 rounded-full bg-plum-700 px-6 text-sm font-medium text-white">
                  <Sparkles size={15} aria-hidden="true" /> Ask the advisor
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function ShopSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="h-4 w-24 animate-pulse rounded bg-lavender-100" />
      <div className="mt-4 h-12 w-64 animate-pulse rounded bg-lavender-100" />
      <div className="mt-10 grid gap-10 lg:grid-cols-[240px_1fr]">
        <div className="hidden h-96 animate-pulse rounded-2xl bg-lavender-100/50 lg:block" />
        <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto max-w-7xl px-5 pb-10 pt-10 md:px-12 md:pt-14">
      <Suspense fallback={<ShopSkeleton />}>
        <ShopResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

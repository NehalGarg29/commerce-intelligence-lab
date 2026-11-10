import type { Product } from "./types";
import { FEATURE_LABELS, slugify } from "./attributes";

// Every filter lives in the URL, so any filtered view is a shareable link
// (and the AI advisor can deep-link shoppers into a filtered catalog later).

export const AUDIENCES: Record<string, string> = {
  "for-her": "For her",
  "for-him": "For him",
  "for-couples": "Couples",
};

export const BRANDS = ["Lumen Atelier", "Velvet Theory", "Pulse Lab", "Lumen Essentials"];
const BRAND_BY_SLUG = Object.fromEntries(BRANDS.map((b) => [slugify(b), b]));

export const BUDGETS = [50, 100, 150];

export const FILTER_FEATURES = [
  "beginner-friendly",
  "whisper-quiet",
  "waterproof",
  "travel-size",
  "app-free",
  "rechargeable",
  "warming",
  "gift",
];

export const SORTS = {
  featured: "Featured",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  rating: "Best reviewed",
  name: "Name: A to Z",
} as const;
export type SortKey = keyof typeof SORTS;

export type ShopFilters = {
  q: string;
  audience: string | null;
  category: "care" | null;
  brand: string | null; // brand slug
  tags: string[];
  maxPrice: number | null;
  inStock: boolean;
  minRating: 4 | null;
  sort: SortKey;
};

type RawParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// Untrusted URL input is whitelisted value by value: anything unknown is ignored.
export function parseShopParams(raw: RawParams): ShopFilters {
  const audience = one(raw.audience);
  const brand = one(raw.brand);
  const tagValues = ([] as string[]).concat(raw.tag ?? []).flatMap((t) => t.split(","));
  const maxPrice = Number(one(raw.maxPrice));
  const sort = one(raw.sort);

  return {
    q: (one(raw.q) ?? "").trim().slice(0, 80),
    audience: audience && audience in AUDIENCES ? audience : null,
    category: one(raw.category) === "care" ? "care" : null,
    brand: brand && brand in BRAND_BY_SLUG ? brand : null,
    tags: [...new Set(tagValues.filter((t) => t in FEATURE_LABELS))],
    maxPrice: Number.isFinite(maxPrice) && maxPrice > 0 ? maxPrice : null,
    inStock: one(raw.inStock) === "1",
    minRating: one(raw.rating) === "4" ? 4 : null,
    sort: sort && sort in SORTS ? (sort as SortKey) : "featured",
  };
}

export function brandName(slug: string): string {
  return BRAND_BY_SLUG[slug] ?? slug;
}

function matchesQuery(p: Product, q: string): boolean {
  const haystack = [p.title, p.description, p.brand, p.type, ...p.tags].join(" ").toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

export function applyFilters(products: Product[], f: ShopFilters): Product[] {
  const result = products.filter((p) => {
    // Gift packaging is an add-on, not a product to browse (still findable by search)
    if (p.tags.includes("gift-box") && !f.q) return false;
    if (f.q && !matchesQuery(p, f.q)) return false;
    if (f.audience && !p.tags.includes(f.audience)) return false;
    if (f.category === "care" && p.brand !== "Lumen Essentials") return false;
    if (f.audience && p.brand === "Lumen Essentials") return false;
    if (f.brand && slugify(p.brand) !== f.brand) return false;
    if (f.tags.some((t) => !p.tags.includes(t))) return false;
    if (f.maxPrice !== null && p.priceMin > f.maxPrice) return false;
    if (f.inStock && !p.available) return false;
    if (f.minRating !== null && (p.rating?.average ?? 0) < f.minRating) return false;
    return true;
  });

  switch (f.sort) {
    case "price-asc":
      return result.sort((a, b) => a.priceMin - b.priceMin);
    case "price-desc":
      return result.sort((a, b) => b.priceMin - a.priceMin);
    case "rating":
      // Average first, then number of reviews; unrated products last
      return result.sort(
        (a, b) =>
          (b.rating?.average ?? 0) - (a.rating?.average ?? 0) || (b.rating?.count ?? 0) - (a.rating?.count ?? 0)
      );
    case "name":
      return result.sort((a, b) => a.title.localeCompare(b.title));
    default:
      // Featured: in-stock first, then Shopify's own order
      return result.sort((a, b) => Number(b.available) - Number(a.available));
  }
}

export const DEFAULT_FILTERS: ShopFilters = {
  q: "",
  audience: null,
  category: null,
  brand: null,
  tags: [],
  maxPrice: null,
  inStock: false,
  minRating: null,
  sort: "featured",
};

export function shopHref(f: ShopFilters, patch: Partial<ShopFilters> = {}): string {
  const next = { ...f, ...patch };
  const sp = new URLSearchParams();
  if (next.q) sp.set("q", next.q);
  if (next.audience) sp.set("audience", next.audience);
  if (next.category) sp.set("category", next.category);
  if (next.brand) sp.set("brand", next.brand);
  if (next.tags.length) sp.set("tag", next.tags.join(","));
  if (next.maxPrice !== null) sp.set("maxPrice", String(next.maxPrice));
  if (next.inStock) sp.set("inStock", "1");
  if (next.minRating) sp.set("rating", String(next.minRating));
  if (next.sort !== "featured") sp.set("sort", next.sort);
  const qs = sp.toString();
  return qs ? `/shop?${qs}` : "/shop";
}

export function activeFilterCount(f: ShopFilters): number {
  return (
    (f.q ? 1 : 0) +
    (f.audience ? 1 : 0) +
    (f.category ? 1 : 0) +
    (f.brand ? 1 : 0) +
    f.tags.length +
    (f.maxPrice !== null ? 1 : 0) +
    (f.inStock ? 1 : 0) +
    (f.minRating ? 1 : 0)
  );
}

export function pageTitle(f: ShopFilters): { title: string; subtitle: string } {
  if (f.q) return { title: `Results for “${f.q}”`, subtitle: "Searching names, descriptions and features." };
  if (f.audience) return { title: AUDIENCES[f.audience], subtitle: "Thoughtfully designed, body-safe and discreetly delivered." };
  if (f.category === "care") return { title: "Care", subtitle: "Lubricants and cleaners that work with every collection." };
  if (f.brand) return { title: brandName(f.brand), subtitle: "Every piece from this brand, live from the catalog." };
  if (f.tags.length === 1) return { title: FEATURE_LABELS[f.tags[0]], subtitle: "Filtered by a feature from the product catalog." };
  return { title: "Shop all", subtitle: "Every product, with live prices and stock from Shopify." };
}

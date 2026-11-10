import { cache } from "react";
import { cacheLife } from "next/cache";
import { shopifyCatalog } from "./shopify-provider";
import type { Product } from "./types";
import { getReviewIntel } from "@/lib/reviews";

// The one place the app gets catalog data from. Swapping Shopify for another
// provider (seeded database, ERP, another platform) only changes this file.

// Live data: prices and stock. Never cached across requests; React's cache()
// only de-duplicates calls made during the same request.
// Ratings come from the review database and are merged in here, so every page
// (cards, filters, compare, the advisor) sees the same numbers.
async function withRatings(products: Product[]): Promise<Product[]> {
  const intel = await getReviewIntel();
  return products.map((p) => {
    const r = intel[p.handle];
    return { ...p, rating: r && r.count > 0 ? { average: r.average, count: r.count } : null };
  });
}

export const getProducts = cache(async () => withRatings(await shopifyCatalog.listProducts()));
export const getProduct = cache(async (handle: string) => {
  const p = await shopifyCatalog.getProduct(handle);
  return p ? (await withRatings([p]))[0] : null;
});
export const getCollectionProducts = cache(async (handle: string) => {
  const list = await shopifyCatalog.getCollectionProducts(handle);
  return list ? withRatings(list) : null;
});

// Merchandising content (collection titles and images) changes rarely, so it is
// cached for a few minutes and becomes part of the instantly-served page shell.
export async function getCollections() {
  "use cache";
  cacheLife("minutes");
  return shopifyCatalog.listCollections();
}

// Merchant-curated "Featured" collection in Shopify, falling back to Shopify's
// built-in Home page collection, then to a fixed list if neither is set up.
const FALLBACK_FEATURED = ["aura-wand", "ember-mini", "tide-duo", "silk-glide"];

export async function getFeaturedProducts(): Promise<Product[]> {
  for (const handle of ["featured", "frontpage"]) {
    const products = await getCollectionProducts(handle);
    if (products && products.length > 0) return products.slice(0, 8);
  }
  const all = await getProducts();
  return FALLBACK_FEATURED.map((h) => all.find((p) => p.handle === h)).filter(
    (p): p is Product => p !== undefined
  );
}

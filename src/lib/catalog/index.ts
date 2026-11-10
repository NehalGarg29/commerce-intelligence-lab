import { cache } from "react";
import { cacheLife } from "next/cache";
import { shopifyCatalog } from "./shopify-provider";
import type { Product } from "./types";

// The one place the app gets catalog data from. Swapping Shopify for another
// provider (seeded database, ERP, another platform) only changes this file.

// Live data: prices and stock. Never cached across requests; React's cache()
// only de-duplicates calls made during the same request.
export const getProducts = cache(() => shopifyCatalog.listProducts());
export const getProduct = cache((handle: string) => shopifyCatalog.getProduct(handle));
export const getCollectionProducts = cache((handle: string) =>
  shopifyCatalog.getCollectionProducts(handle)
);

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

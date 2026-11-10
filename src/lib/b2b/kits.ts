import type { Product } from "@/lib/catalog/types";
import { retailMargin, wholesalePrice, type PriceList } from "./pricing";

// Shelf-ready kits: curated assortments a retailer can stock in one click,
// with an extra discount on top of their wholesale price.

export type KitDef = {
  id: string;
  name: string;
  occasion: string;
  blurb: string;
  discountPct: number;
  items: { handle: string; units: number }[];
};

export const KITS: KitDef[] = [
  {
    id: "beginner-shelf",
    name: "Beginner Shelf",
    occasion: "Always-on",
    blurb: "Easy first purchases that are quiet, simple and well reviewed, with care basics.",
    discountPct: 5,
    items: [
      { handle: "ember-mini", units: 3 },
      { handle: "petite-wand", units: 3 },
      { handle: "still-point", units: 3 },
      { handle: "drift", units: 3 },
      { handle: "silk-glide", units: 6 },
      { handle: "clean-ritual", units: 4 },
    ],
  },
  {
    id: "couples-gifting",
    name: "Couples & Gifting Shelf",
    occasion: "Valentine's & holidays",
    blurb: "Shared experiences and giftable pieces that sell well in the run-up to gifting seasons.",
    discountPct: 5,
    items: [
      { handle: "tide-duo", units: 2 },
      { handle: "sync-ring", units: 3 },
      { handle: "closer-cards", units: 6 },
      { handle: "massage-candle", units: 4 },
      { handle: "duet-massage-oil", units: 4 },
      { handle: "silk-blindfold-set", units: 3 },
    ],
  },
  {
    id: "lgbtq-shelf",
    name: "LGBTQ+ Collection Shelf",
    occasion: "Pride month & year-round",
    blurb: "The LGBTQ+ range, merchandised together with an inclusive card game and Pride-edition glide.",
    discountPct: 7,
    items: [
      { handle: "spectrum-wand", units: 3 },
      { handle: "kinship-harness", units: 2 },
      { handle: "kinship-shape", units: 3 },
      { handle: "pride-discovery-set", units: 2 },
      { handle: "closer-cards-queer", units: 6 },
      { handle: "prism-glide", units: 6 },
    ],
  },
];

export type CatalogEntry = {
  handle: string;
  title: string;
  brand: string;
  variantId: string;
  wholesale: number;
  retail: number;
  stock: number | null;
  available: boolean;
};

export type KitView = KitDef & {
  lines: { handle: string; title: string; units: number }[];
  units: number;
  cost: number; // after kit discount
  retailValue: number;
  profit: number;
  margin: number;
  available: boolean;
  missing: string[];
};

const round2 = (n: number) => Math.round(n * 100) / 100;

// Each product is priced through the retailer's own price list (first in-stock option).
export function buildCatalog(products: Product[], list: PriceList): Record<string, CatalogEntry> {
  const out: Record<string, CatalogEntry> = {};
  for (const p of products) {
    if (p.tags.includes("gift-box") || p.variants.length === 0) continue;
    const v = p.variants.find((x) => x.available) ?? p.variants[0];
    out[p.handle] = {
      handle: p.handle,
      title: p.title,
      brand: p.brand,
      variantId: v.id,
      wholesale: wholesalePrice(v.id, v.price, list),
      retail: v.price,
      stock: v.quantity,
      available: v.available,
    };
  }
  return out;
}

export function resolveKits(catalog: Record<string, CatalogEntry>): KitView[] {
  return KITS.map((k) => {
    const missing: string[] = [];
    let gross = 0;
    let retailValue = 0;
    const lines = k.items.flatMap((i) => {
      const c = catalog[i.handle];
      if (!c || !c.available || (c.stock !== null && c.stock < i.units)) {
        missing.push(c?.title ?? i.handle);
        return [];
      }
      gross += c.wholesale * i.units;
      retailValue += c.retail * i.units;
      return [{ handle: i.handle, title: c.title, units: i.units }];
    });
    const cost = round2(gross * (1 - k.discountPct / 100));
    return {
      ...k,
      lines,
      units: lines.reduce((s, l) => s + l.units, 0),
      cost,
      retailValue: round2(retailValue),
      profit: round2(retailValue - cost),
      margin: retailMargin(retailValue, cost),
      available: missing.length === 0,
      missing,
    };
  });
}

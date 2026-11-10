import type { Product, Variant } from "@/lib/catalog/types";

// Curated "rituals": a set of products plus how to enjoy them together.
// Copy describes an experience (unwind, slow down), never a health benefit.
// Prices, stock and images always come live from Shopify; only the pairing
// and the steps live here.

export type Ritual = {
  id: string;
  name: string;
  tagline: string;
  steps: { handle: string; text: string }[];
};

export const RITUALS: Ritual[] = [
  {
    id: "wind-down",
    name: "The Wind-Down Ritual",
    tagline: "For slow evenings and a calmer pace.",
    steps: [
      { handle: "massage-candle", text: "Light the candle and let the wax pool while you settle in." },
      { handle: "still-point", text: "Ease tension from shoulders and back on a low setting." },
      { handle: "duet-massage-oil", text: "Finish with a slow, unhurried massage." },
    ],
  },
  {
    id: "first-time",
    name: "The First-Time Ritual",
    tagline: "Everything you need, nothing you don't.",
    steps: [
      { handle: "ember-mini", text: "Start on the lowest setting and take your time." },
      { handle: "silk-glide", text: "A water-based glide that's safe with silicone." },
      { handle: "clean-ritual", text: "Clean before and after, then store it away." },
    ],
  },
  {
    id: "together",
    name: "The Together Ritual",
    tagline: "A night in, made for two.",
    steps: [
      { handle: "closer-cards", text: "Open with a few cards to get talking." },
      { handle: "silk-blindfold-set", text: "Slow things down and heighten anticipation." },
      { handle: "tandem-duo", text: "Share one remote, and every setting." },
    ],
  },
];

export const RITUAL_IDS = new Set(RITUALS.map((r) => r.id));

export type ResolvedRitual = Ritual & {
  items: { product: Product; variant: Variant; text: string }[];
  missing: string[]; // handles not found or out of stock
  total: number;
};

// Pick the first in-stock variant of each product. A ritual is only offered
// as "add all" when every item can actually be bought right now.
export function resolveRitual(ritual: Ritual, products: Product[]): ResolvedRitual {
  const items: ResolvedRitual["items"] = [];
  const missing: string[] = [];
  for (const step of ritual.steps) {
    const product = products.find((p) => p.handle === step.handle);
    const variant = product?.variants.find((v) => v.available);
    if (product && variant) items.push({ product, variant, text: step.text });
    else missing.push(step.handle);
  }
  return { ...ritual, items, missing, total: items.reduce((sum, i) => sum + i.variant.price, 0) };
}

export function ritualsFor(handle: string): Ritual[] {
  return RITUALS.filter((r) => r.steps.some((s) => s.handle === handle));
}

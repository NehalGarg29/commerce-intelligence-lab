import type { Product } from "@/lib/catalog/types";

// "What should this retailer stock?" from the brand's own direct-to-consumer
// signals: what shoppers view and add to bag on the storefront, and how well it
// is reviewed. A fixed, explainable formula, not a black box.

export type Demand = Record<string, { views: number; adds: number }>;

export type StockSuggestion = {
  product: Product;
  score: number;
  suggestedUnits: number;
  reasons: string[];
};

export function recommendAssortment(products: Product[], demand: Demand, limit = 8): StockSuggestion[] {
  const eligible = products.filter((p) => p.available && !p.tags.includes("gift-box"));
  const maxViews = Math.max(1, ...eligible.map((p) => demand[p.handle]?.views ?? 0));

  const scored = eligible.map((p) => {
    const d = demand[p.handle] ?? { views: 0, adds: 0 };
    const interest = d.views / maxViews; // 0..1
    const conversion = d.views > 0 ? Math.min(1, d.adds / d.views / 0.1) : 0; // 10% view->bag = full marks
    const rating = p.rating ? (p.rating.average - 3) / 2 : 0.3; // 3★ -> 0, 5★ -> 1; unrated is neutral-low
    const score = Math.round((0.45 * interest + 0.35 * conversion + 0.2 * Math.max(0, rating)) * 100);

    const reasons: string[] = [];
    if (d.views > 0) reasons.push(`${d.views} storefront views in 14 days`);
    if (d.adds > 0) reasons.push(`${Math.round((d.adds / Math.max(1, d.views)) * 1000) / 10}% view → bag`);
    if (p.rating) reasons.push(`${p.rating.average.toFixed(1)}★ from ${p.rating.count} demo reviews`);

    // Opening order sized by demand tier, never more than the brand has in stock.
    const tier = score >= 60 ? 12 : score >= 35 ? 6 : 3;
    const units = p.totalInventory !== null ? Math.min(tier, p.totalInventory) : tier;
    return { product: p, score, suggestedUnits: units, reasons };
  });

  return scored
    .filter((s) => s.suggestedUnits > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

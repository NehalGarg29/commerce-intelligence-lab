// Wholesale pricing, mirroring how Shopify B2B price lists work:
// a fixed price for a variant wins; otherwise the catalog's percentage
// adjustment is applied to the retail price.

export type PriceAdjustment = { type: "PERCENTAGE_DECREASE" | "PERCENTAGE_INCREASE"; value: number };

export type PriceList = {
  currency: string;
  adjustment: PriceAdjustment | null;
  fixedPrices: Record<string, number>; // variant id -> price
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function wholesalePrice(variantId: string, retail: number, list: PriceList): number {
  const fixed = list.fixedPrices[variantId];
  if (fixed !== undefined) return round2(fixed);
  if (!list.adjustment) return round2(retail);
  const factor =
    list.adjustment.type === "PERCENTAGE_DECREASE" ? 1 - list.adjustment.value / 100 : 1 + list.adjustment.value / 100;
  return round2(retail * factor);
}

// Retailer's gross margin if they sell at the brand's retail price.
export function retailMargin(retail: number, wholesale: number): number {
  return retail > 0 ? (retail - wholesale) / retail : 0;
}

export function describeAdjustment(a: PriceAdjustment | null): string {
  if (!a) return "Retail pricing";
  return a.type === "PERCENTAGE_DECREASE" ? `${a.value}% off retail` : `${a.value}% above retail`;
}

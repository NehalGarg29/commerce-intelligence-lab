import type { CatalogEntry, KitView } from "./kits";
import { currentTier, FREE_FREIGHT_MIN, FREIGHT_FLAT, nextTier } from "./program";

// One pure function computes a wholesale order. The portal runs it in the
// browser for instant feedback; the server runs it again on submit with fresh
// prices and stock, so totals can never be tampered with from the client.

export type OrderInput = {
  items: Record<string, number>; // handle -> units (individual products)
  kits: Record<string, number>; // kit id -> number of kits
};

export type OrderLine = { handle: string; title: string; variantId: string; units: number; unitPrice: number };

const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeOrder(input: OrderInput, catalog: Record<string, CatalogEntry>, kits: KitView[]) {
  const qty = new Map<string, number>();
  const problems: string[] = [];
  let itemsSubtotal = 0;
  let kitsGross = 0;
  let kitSavings = 0;
  let retailValue = 0;

  for (const [handle, raw] of Object.entries(input.items)) {
    const units = Math.floor(raw);
    if (!(units > 0)) continue;
    const c = catalog[handle];
    if (!c) continue;
    itemsSubtotal += c.wholesale * units;
    retailValue += c.retail * units;
    qty.set(handle, (qty.get(handle) ?? 0) + units);
  }

  for (const [kitId, raw] of Object.entries(input.kits)) {
    const count = Math.floor(raw);
    if (!(count > 0)) continue;
    const kit = kits.find((k) => k.id === kitId);
    if (!kit) continue;
    if (!kit.available) {
      problems.push(`${kit.name} is unavailable right now.`);
      continue;
    }
    for (const l of kit.lines) {
      const c = catalog[l.handle];
      const gross = c.wholesale * l.units * count;
      kitsGross += gross;
      kitSavings += gross * (kit.discountPct / 100);
      retailValue += c.retail * l.units * count;
      qty.set(l.handle, (qty.get(l.handle) ?? 0) + l.units * count);
    }
  }

  const lines: OrderLine[] = [];
  for (const [handle, units] of qty) {
    const c = catalog[handle];
    if (!c.available || (c.stock !== null && c.stock < units)) {
      problems.push(`Only ${c.stock ?? 0} of ${c.title} available.`);
    }
    lines.push({ handle, title: c.title, variantId: c.variantId, units, unitPrice: c.wholesale });
  }

  const subtotal = round2(itemsSubtotal + kitsGross - kitSavings);
  const tier = currentTier(subtotal);
  const tierSavings = round2(tier ? subtotal * (tier.extraPct / 100) : 0);
  const afterDiscounts = round2(subtotal - tierSavings);
  const freight = afterDiscounts === 0 || afterDiscounts >= FREE_FREIGHT_MIN ? 0 : FREIGHT_FLAT;

  return {
    lines,
    units: lines.reduce((s, l) => s + l.units, 0),
    grossSubtotal: round2(itemsSubtotal + kitsGross),
    kitSavings: round2(kitSavings),
    subtotal,
    tier,
    tierSavings,
    next: nextTier(subtotal),
    freight,
    freightRemaining: freight === 0 ? 0 : round2(FREE_FREIGHT_MIN - afterDiscounts),
    total: round2(afterDiscounts + freight),
    retailValue: round2(retailValue),
    problems,
  };
}

export type OrderSummary = ReturnType<typeof computeOrder>;

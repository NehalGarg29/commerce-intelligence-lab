import type { Product } from "./catalog/types";
import { careAdvice } from "./catalog/compatibility";
import { productImageSrc } from "./catalog/local-images";
import { formatPrice } from "./format";

// Build-your-ritual: one device + one glide/care + one extra = 10% off.
// The rules live here (pure functions) so the page, the server action and the
// tests all agree on what counts as a valid bundle.

export const BUNDLE_DISCOUNT_PCT = 10;
export const BUNDLE_CODE = "RITUAL10"; // created in Shopify admin → Discounts
export const BUNDLE_ATTRIBUTE = "Ritual bundle";

export type Slot = "device" | "care" | "extra";

const CARE_TYPES = /lubricant|toy cleaner/i;
const EXTRA_TYPES = /card game|accessory set|massage candle|massage oil|storage case/i;

export function slotFor(p: Product): Slot | null {
  if (p.tags.includes("gift-box")) return null;
  if (CARE_TYPES.test(p.type)) return "care";
  if (EXTRA_TYPES.test(p.type)) return "extra";
  if (careAdvice(p)) return "device"; // anything that needs lubricant guidance is a device
  return null;
}

// Why a care product can't be paired with this device, or null if it's fine.
export function incompatibility(device: Product | undefined, care: Product): string | null {
  if (!device) return null;
  if (device.tags.includes("body-safe-silicone") && care.tags.includes("silicone-based")) {
    return `Silicone-based glide isn't recommended with ${device.title} (silicone).`;
  }
  return null;
}

export type BundleOption = {
  handle: string;
  title: string;
  brand: string;
  type: string;
  price: number;
  priceLabel: string;
  imageUrl: string | null;
  rating: { average: number; count: number } | null;
  silicone: boolean; // device made of silicone / silicone-based glide
};

function toOption(p: Product): BundleOption {
  const v = p.variants.find((x) => x.available) ?? p.variants[0];
  return {
    handle: p.handle,
    title: p.title,
    brand: p.brand,
    type: p.type,
    price: v?.price ?? p.priceMin,
    priceLabel: formatPrice(v?.price ?? p.priceMin),
    imageUrl: productImageSrc(p.handle, p.imageUrl),
    rating: p.rating,
    silicone: p.tags.includes("body-safe-silicone") || p.tags.includes("silicone-based"),
  };
}

export function bundleOptions(products: Product[]) {
  const live = products.filter((p) => p.available);
  const bySlot = (s: Slot) =>
    live
      .filter((p) => slotFor(p) === s)
      .sort((a, b) => (b.rating?.average ?? 0) - (a.rating?.average ?? 0))
      .map(toOption);
  return { devices: bySlot("device"), care: bySlot("care"), extras: bySlot("extra") };
}

export type BundleCheck =
  | { ok: true; device: Product; care: Product; extra: Product }
  | { ok: false; error: string };

// Server-side validation of a submitted bundle.
export function validateBundle(products: Product[], handles: { device: string; care: string; extra: string }): BundleCheck {
  const find = (h: string) => products.find((p) => p.handle === h && p.available);
  const device = find(handles.device);
  const care = find(handles.care);
  const extra = find(handles.extra);
  if (!device || slotFor(device) !== "device") return { ok: false, error: "Please choose an available device." };
  if (!care || slotFor(care) !== "care") return { ok: false, error: "Please choose an available glide or care item." };
  if (!extra || slotFor(extra) !== "extra") return { ok: false, error: "Please choose an available extra." };
  const clash = incompatibility(device, care);
  if (clash) return { ok: false, error: clash };
  return { ok: true, device, care, extra };
}

export function bundleTotals(prices: number[]) {
  const subtotal = Math.round(prices.reduce((s, n) => s + n, 0) * 100) / 100;
  const savings = Math.round(subtotal * BUNDLE_DISCOUNT_PCT) / 100;
  return { subtotal, savings, total: Math.round((subtotal - savings) * 100) / 100 };
}

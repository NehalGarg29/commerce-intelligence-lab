// Rendered placeholder images that ship with the repo (public/images/products).
// A product photo uploaded in Shopify always wins; these are only the fallback.
const RENDERED = new Set([
  "aura-wand", "ember-mini", "halo-mini", "petal-pulse", "velvet-arc", "drift",
  "tide-duo", "sync-ring", "echo-remote", "contour-sleeve", "flux-stroker",
  "comfort-ring-set", "silk-glide", "velvet-silicone", "clean-ritual", "discovery-kit",
]);

export function productImageSrc(handle: string, shopifyUrl: string | null): string | null {
  if (shopifyUrl) return shopifyUrl;
  return RENDERED.has(handle) ? `/images/products/${handle}.jpg` : null;
}

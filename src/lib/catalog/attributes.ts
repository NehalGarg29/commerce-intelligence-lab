// Human-friendly labels for the feature tags we set in Shopify.
// Only tags listed here are shown to shoppers, so internal tags stay internal.
export const FEATURE_LABELS: Record<string, string> = {
  "whisper-quiet": "Whisper-quiet",
  "beginner-friendly": "Beginner-friendly",
  waterproof: "Waterproof",
  "travel-size": "Travel size",
  "app-free": "App-free",
  rechargeable: "Rechargeable",
  "body-safe-silicone": "Body-safe silicone",
  "water-based": "Water-based",
  "toy-safe": "Toy-safe",
  warming: "Warming",
  gift: "Gift-ready",
};

export function featureLabels(tags: string[], max = 2): string[] {
  return tags
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t in FEATURE_LABELS)
    .slice(0, max)
    .map((t) => FEATURE_LABELS[t]);
}

export function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

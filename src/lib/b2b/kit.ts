import type { Product } from "@/lib/catalog/types";
import { FEATURE_LABELS } from "@/lib/catalog/attributes";
import { careSteps, guideFor } from "@/lib/guides";
import { themeVerdict, type ProductReviewIntel } from "@/lib/reviews/analyze";
import { formatPrice } from "@/lib/format";

// A retailer marketing kit built ONLY from approved data: the Shopify
// description, catalog features, the how-to guide, care steps and review
// themes. Captions are fixed templates filled with those facts, so nothing a
// retailer copies can contain an invented claim.

export type MarketingKit = {
  handle: string;
  title: string;
  brand: string;
  retailPrice: string;
  description: string;
  features: string[];
  howTo: { summary: string; steps: string[] } | null;
  care: string[];
  praisedFor: { label: string; mentions: number }[];
  captions: string[];
  images: { url: string; alt: string }[];
  rules: string[];
};

export function buildKit(p: Product, intel: ProductReviewIntel | null): MarketingKit {
  const features = p.tags.filter((t) => t in FEATURE_LABELS).map((t) => FEATURE_LABELS[t]);
  const guide = guideFor(p);
  const praised = (intel?.themes ?? [])
    .filter((t) => themeVerdict(t) === "praised")
    .slice(0, 3)
    .map((t) => ({ label: t.label, mentions: t.mentions }));
  const f = features.map((x) => x.toLowerCase());

  const captions = [
    `Meet ${p.title} by ${p.brand}${f.length ? `: ${f.slice(0, 2).join(" and ")}` : ""}. Discreetly packaged.`,
    guide ? `New to ${guide.name.toLowerCase()}? ${p.title} is an easy place to start. Ask us how to use it.` : `${p.title}, now in store.`,
    praised.length ? `Reviewers highlight its ${praised.map((x) => x.label.toLowerCase()).join(", ")}.` : `Thoughtfully designed, body-safe and discreetly delivered.`,
  ];

  return {
    handle: p.handle,
    title: p.title,
    brand: p.brand,
    retailPrice: formatPrice(p.priceMin, p.priceMax),
    description: p.description,
    features,
    howTo: guide ? { summary: guide.summary, steps: guide.steps } : null,
    care: careSteps(p),
    praisedFor: praised,
    captions,
    images: p.images.map((i) => ({ url: i.url, alt: i.alt ?? p.title })),
    rules: [
      "Use the approved description and features as written.",
      "No medical or health claims (e.g. 'treats', 'cures', 'improves').",
      "Don't quote star ratings or review praise publicly: reviews in this prototype are fictional demo data.",
      "Keep imagery and language non-explicit.",
    ],
  };
}

export function kitToMarkdown(k: MarketingKit): string {
  const lines = [
    `# ${k.title} — retailer marketing kit`,
    `${k.brand} · Suggested retail price (MSRP) ${k.retailPrice}. You set your own prices.`,
    "",
    "## Approved description",
    k.description,
    "",
    "## Key features",
    ...k.features.map((f) => `- ${f}`),
    "",
  ];
  if (k.howTo) lines.push("## How to use (for staff and shoppers)", k.howTo.summary, ...k.howTo.steps.map((s, i) => `${i + 1}. ${s}`), "");
  if (k.care.length) lines.push("## Care", ...k.care.map((c) => `- ${c}`), "");
  lines.push("## Ready-to-use captions", ...k.captions.map((c) => `- ${c}`), "");
  if (k.images.length) lines.push("## Images", ...k.images.map((i) => `- ${i.alt}: ${i.url}`), "");
  lines.push("## Usage rules", ...k.rules.map((r) => `- ${r}`), "", "_Independent concept prototype: fictional demo data._");
  return lines.join("\n");
}

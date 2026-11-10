import type { Product } from "./catalog/types";

// Plain-language "how to use" guides, written once per product TYPE rather than
// per product, so every product in Shopify gets a guide as soon as its type is set.
// Rules for this content:
//  - general, practical guidance only — no medical or health claims
//  - never invent product specs (charge times, ratings, materials); anything
//    product-specific is derived from the product's real Shopify tags below
// The AI advisor will read these same guides, so the store and the AI agree.

export type GuideGroup = "solo" | "together" | "care";

export type Guide = {
  slug: string;
  name: string; // plural, used as a heading: "Wand massagers"
  group: GuideGroup;
  summary: string; // what it is, in one or two sentences
  goodFor: string[];
  steps: string[]; // getting started
};

export const GROUP_LABELS: Record<GuideGroup, { title: string; blurb: string }> = {
  solo: { title: "For solo time", blurb: "Personal devices, from the simplest shapes to more specific designs." },
  together: { title: "For two", blurb: "Things made to be shared, from massage to games and wearables." },
  care: { title: "Comfort & care", blurb: "The small things that make everything else better." },
};

export const GUIDES: Guide[] = [
  {
    slug: "wand-massagers",
    name: "Wand massagers",
    group: "solo",
    summary:
      "A handle with a soft, rounded head. Used on the outside of the body, it gives broad, rumbly vibration, which makes it one of the easiest shapes to start with.",
    goodFor: ["A simple first purchase", "Body massage as well as intimate use", "Solo time or with a partner"],
    steps: [
      "Start on the lowest setting. You can always go up.",
      "If direct vibration feels too strong, try it over clothing or a soft towel first.",
      "Use the broad side of the head for a gentle feel and the tip for something more focused.",
      "Add a few drops of water-based lubricant for comfort.",
    ],
  },
  {
    slug: "bullet-vibrators",
    name: "Bullet vibrators",
    group: "solo",
    summary:
      "Small, lipstick-sized vibrators with a tapered tip. They're used externally, give focused vibration, and are easy to travel with.",
    goodFor: ["Beginners", "Travel", "Partnered time, since they're small enough to hold between you"],
    steps: [
      "Start on the lowest setting.",
      "Use the tip for focused sensation and the side for something broader.",
      "Move it slowly and notice what feels good before changing settings.",
      "A little water-based lubricant makes it more comfortable.",
    ],
  },
  {
    slug: "lay-on-vibrators",
    name: "Lay-on vibrators",
    group: "solo",
    summary:
      "Palm-sized and shaped to rest against the body, so you don't need to grip it or hold an awkward angle.",
    goodFor: ["Hands-free comfort", "Anyone who finds gripping tiring", "Quiet, low-key use"],
    steps: [
      "Rest it flat against the body and let it sit there.",
      "Change the pressure with your palm rather than the setting at first.",
      "Start low and build up slowly.",
    ],
  },
  {
    slug: "air-pulse-stimulators",
    name: "Air-pulse stimulators",
    group: "solo",
    summary:
      "Instead of vibrating against the skin, a soft opening creates gentle pulses of air around the area. Many people find it a softer, different kind of sensation.",
    goodFor: ["Anyone who finds direct vibration too intense", "Trying a new kind of sensation"],
    steps: [
      "Put a little water-based lubricant on the rim so it sits comfortably against the skin.",
      "Place the opening over the area. There's no need to press hard.",
      "Start on the lowest intensity, as it can feel stronger than you expect.",
      "Shift the angle slightly until it feels right.",
    ],
  },
  {
    slug: "classic-vibrators",
    name: "Classic vibrators",
    group: "solo",
    summary:
      "A straight, smooth shape that can be used externally or internally. It's the most familiar design and a flexible first choice.",
    goodFor: ["A first vibrator", "One product that does a bit of everything"],
    steps: [
      "Start outside the body on the lowest setting.",
      "Use plenty of water-based lubricant.",
      "If you use it internally, go slowly and only as far as feels comfortable.",
    ],
  },
  {
    slug: "curved-vibrators",
    name: "Curved vibrators",
    group: "solo",
    summary: "A curved vibrator designed for internal use, with the curve helping it reach the front wall.",
    goodFor: ["People who already enjoy internal use", "Exploring at your own pace"],
    steps: [
      "Use plenty of water-based lubricant.",
      "Get comfortable and relaxed first. There's no rush.",
      "Insert slowly with the curve facing forward, toward the belly button.",
      "Start on the lowest setting and adjust from there.",
    ],
  },
  {
    slug: "dual-stimulators",
    name: "Dual stimulators",
    group: "solo",
    summary:
      "Combines an internal shaft with an external arm, so both areas get sensation at the same time.",
    goodFor: ["People who enjoy both internal and external sensation"],
    steps: [
      "Use plenty of water-based lubricant.",
      "Insert slowly until the outer arm rests comfortably against the body.",
      "Adjust the angle a little at a time to find the right fit.",
      "Start on the lowest setting.",
    ],
  },
  {
    slug: "warming-massagers",
    name: "Warming massagers",
    group: "solo",
    summary: "A massager with a gentle warming function as well as vibration, for a slow, relaxed start.",
    goodFor: ["Slow, relaxing sessions", "Anyone who finds a cool device off-putting"],
    steps: [
      "Switch on the warming function a few minutes before you want to use it.",
      "Check the temperature on the inside of your wrist first.",
      "Start on low vibration.",
      "Stop if anything ever feels too warm.",
    ],
  },
  {
    slug: "strokers",
    name: "Strokers",
    group: "solo",
    summary: "A soft, textured sleeve for solo use. Rechargeable versions add vibration or motion.",
    goodFor: ["Solo time", "Trying different textures"],
    steps: [
      "Use plenty of water-based lubricant. Strokers need more than you'd think.",
      "Start slowly and let the texture do the work.",
      "Clean the inner sleeve after every use and let it dry completely before storing.",
    ],
  },
  {
    slug: "prostate-massagers",
    name: "Prostate massagers",
    group: "solo",
    summary: "A curved massager designed for internal, anal use.",
    goodFor: ["People curious about internal sensation", "Exploring slowly, solo or with a partner"],
    steps: [
      "Use plenty of water-based lubricant. The body doesn't make its own here.",
      "Relax, breathe and go slowly. Never force anything.",
      "Only use products made for anal use, with a flared base.",
      "Start on the lowest setting.",
    ],
  },
  {
    slug: "body-massagers",
    name: "Body massagers",
    group: "together",
    summary:
      "A general massager for shoulders, back and other tense spots. It's a relaxing way to start an evening, alone or together.",
    goodFor: ["Unwinding after a long day", "Giving a partner a massage", "A low-pressure first purchase"],
    steps: [
      "Use it over clothing, or on skin with a little massage oil.",
      "Glide slowly and don't hold it on one spot for long.",
      "Start low and ask your partner what feels good.",
    ],
  },
  {
    slug: "wearables",
    name: "Wearables",
    group: "together",
    summary:
      "Designed to be worn so your hands stay free. Some come with a remote, so a partner can change the settings.",
    goodFor: ["Partnered time", "Couples who want to try something playful"],
    steps: [
      "Try the fit on your own first, so you know how it sits.",
      "Use a little water-based lubricant for comfort.",
      "Agree on a simple way to say 'more' or 'less'.",
      "If it has a remote, test the range before you need it.",
    ],
  },
  {
    slug: "rings",
    name: "Rings",
    group: "together",
    summary:
      "A stretchy ring worn at the base of the penis. Vibrating versions add a small motor that both partners can feel.",
    goodFor: ["Couples", "Adding sensation without adding another device to hold"],
    steps: [
      "Use a little water-based lubricant to slide it on.",
      "It should feel snug, never painful.",
      "Keep sessions short at first.",
      "Take it off straight away if you feel pain, numbness or coldness.",
    ],
  },
  {
    slug: "sets",
    name: "Sets",
    group: "together",
    summary: "A curated set of items that work together, so you don't have to choose each piece yourself.",
    goodFor: ["Gifts", "Couples who want to try a few things"],
    steps: [
      "Try one item at a time first, so you learn what you each like.",
      "Read the guide for each item in the set.",
      "Charge any rechargeable pieces before the first use.",
    ],
  },
  {
    slug: "card-games",
    name: "Card games",
    group: "together",
    summary: "Prompts and questions that help couples talk, laugh and try new things without pressure.",
    goodFor: ["Date nights", "Couples who want to talk more openly", "A gentle first step"],
    steps: [
      "Agree that either of you can skip any card, no questions asked.",
      "Start with the lighter cards.",
      "Put your phones away.",
    ],
  },
  {
    slug: "sensory-accessories",
    name: "Sensory accessories",
    group: "together",
    summary: "Items like a soft blindfold add anticipation by taking one sense away.",
    goodFor: ["Couples trying something new", "Slow, playful evenings"],
    steps: [
      "Talk first about what you'd both like to try.",
      "Agree on a word that means 'stop', and always respect it.",
      "Check in with each other often.",
    ],
  },
  {
    slug: "massage-candles",
    name: "Massage candles",
    group: "together",
    summary: "A candle whose wax melts into a warm oil you can use for massage.",
    goodFor: ["Setting the mood", "Massage with a partner"],
    steps: [
      "Light it and let a pool of melted wax form.",
      "Blow it out, then test a drop on the inside of your wrist.",
      "Pour a little into your hand first, then massage.",
      "Never leave a lit candle unattended.",
    ],
  },
  {
    slug: "massage-oils",
    name: "Massage oils",
    group: "together",
    summary: "A smooth oil for full-body massage, and a relaxed way to start an evening together.",
    goodFor: ["Massage with a partner", "Winding down"],
    steps: [
      "Warm a little between your palms first.",
      "Use long, slow strokes.",
      "Keep it for massage only. Oils can damage latex condoms and some toy materials.",
    ],
  },
  {
    slug: "lubricants",
    name: "Lubricants",
    group: "care",
    summary:
      "Lubricant makes almost everything more comfortable. The main choice is water-based or silicone-based.",
    goodFor: [
      "Water-based: works with every toy and is easy to clean up",
      "Silicone-based: lasts longer, but isn't recommended with silicone toys",
    ],
    steps: [
      "Start with a small amount and add more as you need it.",
      "Reapply if things start to feel dry.",
      "If you have sensitive skin, test a little on your inner arm first.",
    ],
  },
  {
    slug: "toy-cleaners",
    name: "Toy cleaners",
    group: "care",
    summary: "A gentle cleaner made for body-safe materials, so you can clean toys without harsh soaps.",
    goodFor: ["Cleaning before and after every use"],
    steps: [
      "Spray it onto the toy, keeping it away from any charging port.",
      "Wipe or rinse as the label says.",
      "Let the toy dry completely before you store it.",
    ],
  },
  {
    slug: "storage",
    name: "Storage",
    group: "care",
    summary: "A case that keeps things private, clean and free of dust, at home or when travelling.",
    goodFor: ["Privacy", "Travel", "Keeping things clean between uses"],
    steps: [
      "Clean and dry everything before you put it away.",
      "Keep silicone pieces apart from each other, or in separate pouches.",
    ],
  },
];

// Shopify product type → guide. Product types come straight from Shopify,
// so a new product only needs a known type to get its guide.
const TYPE_TO_GUIDE: Record<string, string> = {
  "wand massager": "wand-massagers",
  "bullet vibrator": "bullet-vibrators",
  "lay-on vibrator": "lay-on-vibrators",
  "air-pulse stimulator": "air-pulse-stimulators",
  "classic vibrator": "classic-vibrators",
  "g-spot vibrator": "curved-vibrators",
  "dual stimulator": "dual-stimulators",
  "warming massager": "warming-massagers",
  "textured stroker": "strokers",
  "rechargeable stroker": "strokers",
  "prostate massager": "prostate-massagers",
  "body massager": "body-massagers",
  "couples wearable": "wearables",
  "remote wearable": "wearables",
  "vibrating couples ring": "rings",
  "vibrating ring": "rings",
  "silicone ring set": "rings",
  "couples set": "sets",
  "gift set": "sets",
  "card game": "card-games",
  "accessory set": "sensory-accessories",
  "massage candle": "massage-candles",
  "massage oil": "massage-oils",
  "water-based lubricant": "lubricants",
  "silicone lubricant": "lubricants",
  "toy cleaner": "toy-cleaners",
  "storage case": "storage",
};

export function getGuide(slug: string): Guide | null {
  return GUIDES.find((g) => g.slug === slug) ?? null;
}

export function guideFor(product: Pick<Product, "type" | "title">): Guide | null {
  const slug = TYPE_TO_GUIDE[product.type.trim().toLowerCase()];
  if (slug) return getGuide(slug);
  // Fallback for loosely typed products (e.g. type "Massager" on a wand).
  if (/\bwand\b/i.test(product.title)) return getGuide("wand-massagers");
  return null;
}

// Care steps built only from the product's real Shopify tags, never guessed.
export function careSteps(product: Pick<Product, "tags" | "type" | "brand">): string[] {
  const t = product.tags;
  const steps: string[] = [];
  const rechargeable = t.includes("rechargeable");
  const isDevice = rechargeable || t.includes("body-safe-silicone") || /stroker|sleeve/i.test(product.type);
  if (!isDevice) return steps;

  if (rechargeable) steps.push("Charge it fully before the first use.");
  steps.push("Clean it before and after every use with toy cleaner or mild, unscented soap.");
  if (t.includes("waterproof")) {
    steps.push("It's waterproof, so you can rinse it under warm running water.");
  } else if (rechargeable) {
    steps.push("It isn't marked waterproof: wipe it clean rather than rinsing, and keep the charging port dry.");
  }
  if (t.includes("body-safe-silicone")) {
    steps.push("Store it on its own or in a pouch, not touching other silicone toys.");
  }
  steps.push("Let it dry completely before you put it away.");
  return steps;
}

export const GUIDE_DISCLAIMER =
  "General information, not medical advice. Always follow the instructions that come with your product, and talk to a clinician if you have pain or questions about your health.";

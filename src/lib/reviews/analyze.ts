// Review intelligence as plain, deterministic functions: no AI, no database,
// no framework imports. Same input always gives the same output, which makes
// every number on the page explainable and unit-testable.
//
// Review text is UNTRUSTED. It is shown to shoppers as text (React escapes it)
// and is never treated as instructions by any part of the system. Reviews that
// look like instructions aimed at an AI are held back from ratings, themes and
// the advisor, and counted so a moderator can see them.

export type ReviewRecord = {
  id: string;
  productHandle: string;
  rating: number;
  title: string;
  body: string;
  authorName: string;
  verified: boolean;
  themes: string[];
  createdAt: string; // ISO
};

export type PublicReview = Omit<ReviewRecord, "productHandle" | "themes">;

export type ThemeStat = {
  theme: string;
  label: string;
  mentions: number;
  positive: number; // mentions whose sentence reads positive
  negative: number; // mentions whose sentence reads negative
  evidence: { reviewId: string; quote: string; rating: number; tone: Tone }[];
};

export type Tone = "positive" | "negative";

export type ProductReviewIntel = {
  handle: string;
  count: number;
  average: number; // 1 decimal
  distribution: [number, number, number, number, number]; // 5★ first
  themes: ThemeStat[];
  recent: PublicReview[];
  held: number; // held for moderation (instruction-like text)
};

export const THEME_META: Record<string, { label: string; match: RegExp }> = {
  quiet: { label: "Quiet", match: /quiet|loud|noise/i },
  easy: { label: "Easy to use", match: /button|figure out|easy|simple/i },
  battery: { label: "Battery", match: /battery|charge/i },
  comfort: { label: "Comfort", match: /comfortable|soft|shape|finish/i },
  packaging: { label: "Discreet packaging", match: /box|packag|plain/i },
  cleaning: { label: "Easy to clean", match: /clean|rinse|dry/i },
  intensity: { label: "Intensity", match: /setting|gentle|strong|range/i },
  size: { label: "Size", match: /small|size|washbag|photos/i },
  value: { label: "Value", match: /price|pricey|premium|value/i },
  gift: { label: "As a gift", match: /gift|in the box/i },
  texture: { label: "Texture", match: /sticky|smooth|reapply|dry/i },
  scent: { label: "Scent", match: /scent|smell/i },
  conversation: { label: "Conversation", match: /talking|cards|conversation/i },
  warming: { label: "Warming", match: /warm/i },
};

const INSTRUCTION_LIKE: RegExp[] = [
  /\b(ignore|disregard|forget)\b.{0,40}\b(instructions|rules|prompt)/i,
  /\bsystem\s*:/i,
  /\b(reveal|print|show|leak)\b.{0,40}\b(prompt|api keys?|instructions|secrets?)\b/i,
  /\byou are now\b/i,
  /\b(promo|discount)?\s*code\b.{0,20}\bfree\b|\bfree with code\b/i,
];

export function isInstructionLike(text: string): boolean {
  return INSTRUCTION_LIKE.some((re) => re.test(text));
}

// Strip control characters, collapse whitespace, cap length.
export function cleanText(text: string, max = 1000): string {
  return text.replace(/\p{Cc}/gu, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

// Sentiment is read from the sentence that mentions the theme, not from the
// star rating: a 4-star review can still say "louder than I expected".
const NEGATIVE_CUES =
  /\b(wish|didn't|not for me|expected (a little|a bit) more|disappoint|fiddly|pricey|repetitive|too \w+|a bit|than (i )?expected|than i'd like|than it looks|took me a while|takes a while|more often than)\b/i;

export function sentenceTone(sentence: string): Tone {
  return NEGATIVE_CUES.test(sentence) ? "negative" : "positive";
}

function themeSentence(body: string, theme: string): string | null {
  const meta = THEME_META[theme];
  if (!meta) return null;
  const sentence = body.split(/(?<=[.!?])\s+/).find((s) => meta.match.test(s));
  return sentence ? cleanText(sentence, 200) : null;
}

export function analyzeReviews(handle: string, rows: ReviewRecord[]): ProductReviewIntel {
  const valid = rows.filter((r) => Number.isInteger(r.rating) && r.rating >= 1 && r.rating <= 5);
  const held = valid.filter((r) => isInstructionLike(`${r.title} ${r.body}`));
  const trusted = valid
    .filter((r) => !held.includes(r))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const distribution: ProductReviewIntel["distribution"] = [0, 0, 0, 0, 0];
  let sum = 0;
  for (const r of trusted) {
    distribution[5 - r.rating] += 1;
    sum += r.rating;
  }

  const byTheme = new Map<string, ThemeStat>();
  for (const r of trusted) {
    for (const theme of new Set(r.themes)) {
      if (!THEME_META[theme]) continue;
      const stat =
        byTheme.get(theme) ??
        { theme, label: THEME_META[theme].label, mentions: 0, positive: 0, negative: 0, evidence: [] };
      const sentence = themeSentence(r.body, theme);
      // Without a sentence to read, fall back to the star rating.
      const tone: Tone = sentence ? sentenceTone(sentence) : r.rating >= 3 ? "positive" : "negative";
      stat.mentions += 1;
      stat[tone] += 1;
      // Keep at most one quote of each tone, so the card shows both sides.
      if (sentence && !stat.evidence.some((e) => e.tone === tone)) {
        stat.evidence.push({ reviewId: r.id, quote: sentence, rating: r.rating, tone });
      }
      byTheme.set(theme, stat);
    }
  }

  return {
    handle,
    count: trusted.length,
    average: trusted.length ? Math.round((sum / trusted.length) * 10) / 10 : 0,
    distribution,
    themes: [...byTheme.values()].sort((a, b) => b.mentions - a.mentions || a.theme.localeCompare(b.theme)),
    recent: trusted.slice(0, 8).map((r) => ({
      id: r.id,
      rating: r.rating,
      title: cleanText(r.title, 120),
      body: cleanText(r.body),
      authorName: cleanText(r.authorName, 40),
      verified: r.verified,
      createdAt: r.createdAt,
    })),
    held: held.length,
  };
}

// One-line verdict for a theme, used by the UI and the advisor alike.
export function themeVerdict(t: ThemeStat): "praised" | "criticised" | "mixed" {
  if (t.positive >= t.mentions * 0.7) return "praised";
  if (t.negative >= t.mentions * 0.6) return "criticised";
  return "mixed";
}

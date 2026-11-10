import type { Metadata } from "next";
import { Bot, KeyRound, ShieldCheck, ShoppingCart } from "lucide-react";
import { toolDefinitions } from "@/lib/advisor/tools";
import { ApiExplorer } from "@/components/agents/api-explorer";

export const metadata: Metadata = {
  title: "Agent API · Lumen Atelier",
  description: "The same seven tools behind the shopping advisor, available to outside AI agents.",
};

const EXAMPLES: Record<string, unknown> = {
  searchProducts: { audience: "for-lgbtq", maxPrice: 100, inStockOnly: true, sort: "rating", limit: 3 },
  getProductDetails: { handle: "ember-mini" },
  getProductReviews: { handle: "ember-mini" },
  compareProducts: { handles: ["aura-wand", "petite-wand"] },
  getProductAvailability: { handle: "spectrum-wand" },
  getApprovedPolicy: { topic: "returns" },
  prepareCart: { items: [{ handle: "ember-mini", option: "Plum", quantity: 1 }] },
};

const POINTS = [
  { icon: Bot, title: "Same tools as the advisor", body: "One implementation powers the on-site chat and outside agents, so both give the same answers." },
  { icon: KeyRound, title: "Keyed and rate-limited", body: "Bearer keys stored only as hashes, 60 calls a minute per key, every call logged without its inputs." },
  { icon: ShieldCheck, title: "Same guardrails", body: "Live prices and stock only, approved policy wording only, review text treated as untrusted." },
  { icon: ShoppingCart, title: "Human checkout", body: "prepareCart returns a Shopify checkout link. An agent can build the basket; a person pays." },
];

export default function AgentsPage() {
  const tools = toolDefinitions().map((t) => ({ ...t, example: EXAMPLES[t.name] ?? {} }));

  return (
    <main className="mx-auto max-w-7xl px-5 pb-16 pt-10 md:px-12 md:pt-14">
      <header className="max-w-3xl">
        <p className="text-[11px] tracking-[0.2em] text-ink-muted">FOR DEVELOPERS</p>
        <h1 className="mt-3 font-display text-5xl tracking-tight text-plum-800 md:text-6xl">Agent API</h1>
        <p className="mt-5 text-[17px] leading-relaxed text-ink-muted">
          Let other AI agents shop this store safely: the seven tools behind the Lumen advisor, as a small REST API.
        </p>
      </header>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {POINTS.map((p) => (
          <div key={p.title} className="rounded-3xl bg-lavender-50 p-6">
            <p.icon size={20} className="text-plum-700" aria-hidden="true" />
            <p className="mt-3 font-display text-lg text-ink">{p.title}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{p.body}</p>
          </div>
        ))}
      </div>

      <ApiExplorer tools={tools} />
    </main>
  );
}

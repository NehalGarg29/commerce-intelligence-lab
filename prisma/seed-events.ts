// Seeds 14 days of SIMULATED storefront traffic so /insights has something to
// show in a demo. Every row has metadata.demo = true and the dashboard labels it.
// Counts are deterministic; dates are relative to today.
//
// Run with: npm run db:seed-events

import { loadEnvConfig } from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

loadEnvConfig(process.cwd());

const HANDLES = [
  "aura-wand", "ember-mini", "petite-wand", "still-point", "tide-duo", "sync-ring", "spectrum-wand",
  "velvet-arc", "drift", "halo-mini", "petal-pulse", "twin-arc", "ember-warm", "axis", "pulse-ring-pro",
  "flux-stroker", "pulse-stroker-mini", "contour-sleeve", "comfort-ring-set", "echo-remote", "closer-cards",
  "closer-cards-queer", "kinship-harness", "kinship-shape", "pride-discovery-set", "discovery-kit",
  "silk-blindfold-set", "massage-candle", "duet-massage-oil", "silk-glide",
];

function rng(seed: number) {
  let h = seed >>> 0 || 1;
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) / 4294967296;
  };
}

type Row = { type: string; sessionId: string; productHandle: string | null; metadata: object; createdAt: Date };

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Missing DATABASE_URL in .env.local");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  const r = rng(20261110);
  // Popular products get more traffic (rough power-law).
  const pickProduct = () => HANDLES[Math.floor(Math.pow(r(), 1.8) * HANDLES.length)];

  const rows: Row[] = [];
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  for (let d = 13; d >= 0; d--) {
    const dayStart = startOfToday.getTime() - d * 86_400_000;
    const weekday = new Date(dayStart).getUTCDay();
    const sessions = Math.round(60 + (weekday === 0 || weekday === 6 ? 25 : 0) + r() * 30);

    for (let s = 0; s < sessions; s++) {
      const sid = `demo-${d}-${s}`;
      let t = dayStart + Math.floor(r() * 86_000_000);
      const at = () => new Date((t += 20_000 + Math.floor(r() * 90_000)));
      const add = (type: string, productHandle: string | null = null, extra: object = {}) =>
        rows.push({ type, sessionId: sid, productHandle, metadata: { demo: true, ...extra }, createdAt: at() });

      const viewed: string[] = [];
      const views = 1 + Math.floor(r() * 4);
      for (let v = 0; v < views; v++) {
        const h = pickProduct();
        viewed.push(h);
        add("product_view", h);
      }
      if (r() < 0.1) add("compare_add", viewed[0]);

      const usesAdvisor = r() < 0.22;
      if (usesAdvisor) {
        add("advisor_open");
        add("advisor_query");
        if (r() < 0.6) {
          const h = pickProduct();
          add("advisor_click", h);
          add("product_view", h);
          viewed.push(h);
        }
      }

      // Simulated effect: advisor sessions add to bag more often.
      if (r() < (usesAdvisor ? 0.17 : 0.07)) {
        const source = usesAdvisor && r() < 0.5 ? "advisor" : r() < 0.08 ? "ritual" : "product_page";
        add("add_to_cart", viewed[viewed.length - 1], { source });
        if (r() < 0.55) add("checkout_start");
      }
    }
  }

  const removed = await db.event.deleteMany({ where: { metadata: { path: ["demo"], equals: true } } });
  let created = 0;
  for (let i = 0; i < rows.length; i += 1000) {
    created += (await db.event.createMany({ data: rows.slice(i, i + 1000) })).count;
  }
  console.log(`Removed ${removed.count} old demo events, created ${created} simulated events.`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

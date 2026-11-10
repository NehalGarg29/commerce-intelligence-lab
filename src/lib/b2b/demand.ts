import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import type { Demand } from "./recommend";

// Storefront demand per product over the last 14 days (views and add-to-bags).
export async function getDemand(): Promise<Demand> {
  "use cache";
  cacheLife("minutes");
  cacheTag("b2b-demand");
  try {
    const since = new Date(Date.now() - 14 * 86_400_000);
    const rows = await db.event.groupBy({
      by: ["productHandle", "type"],
      where: { createdAt: { gte: since }, type: { in: ["product_view", "add_to_cart"] }, productHandle: { not: null } },
      _count: { _all: true },
    });
    const demand: Demand = {};
    for (const r of rows) {
      if (!r.productHandle) continue;
      const d = (demand[r.productHandle] ??= { views: 0, adds: 0 });
      if (r.type === "product_view") d.views += r._count._all;
      else d.adds += r._count._all;
    }
    return demand;
  } catch (err) {
    console.error("[b2b] demand unavailable:", err instanceof Error ? err.message : err);
    return {};
  }
}

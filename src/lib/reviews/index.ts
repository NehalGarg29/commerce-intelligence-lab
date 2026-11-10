import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { analyzeReviews, type ProductReviewIntel, type ReviewRecord } from "./analyze";

export type { ProductReviewIntel, ThemeStat, PublicReview } from "./analyze";

// All demo reviews, analysed once and cached for a few minutes. Shared by
// product cards, product pages, compare, shop sorting and (later) the advisor.
async function loadReviewIntel(): Promise<Record<string, ProductReviewIntel>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("reviews");

  const rows = await db.review.findMany({ orderBy: { createdAt: "desc" } });
  const grouped = new Map<string, ReviewRecord[]>();
  for (const r of rows) {
    const record: ReviewRecord = { ...r, createdAt: r.createdAt.toISOString() };
    grouped.set(r.productHandle, [...(grouped.get(r.productHandle) ?? []), record]);
  }
  return Object.fromEntries([...grouped].map(([handle, list]) => [handle, analyzeReviews(handle, list)]));
}

// Reviews are an enhancement: if the database is unreachable the store keeps
// working with no ratings rather than failing the page.
export async function getReviewIntel(): Promise<Record<string, ProductReviewIntel>> {
  try {
    return await loadReviewIntel();
  } catch (err) {
    console.error("[reviews] unavailable:", err instanceof Error ? err.message : err);
    return {};
  }
}

export async function getProductReviews(handle: string): Promise<ProductReviewIntel | null> {
  return (await getReviewIntel())[handle] ?? null;
}

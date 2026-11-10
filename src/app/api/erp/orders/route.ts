import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { loadOrderFeed } from "@/lib/erp";
import { feedToCsv, feedToErpJson } from "@/lib/erp/compare";

// ERP-ready export of B2B portal orders: CSV for a person, JSON for a connector.
export async function GET(request: NextRequest) {
  const s = await getSession();
  if (s?.role !== "merchant") return NextResponse.json({ error: "Merchant team only" }, { status: 403 });

  const feed = await loadOrderFeed();
  if (!feed.ok) return NextResponse.json({ error: feed.message }, { status: 502 });

  const date = new Date().toISOString().slice(0, 10);
  if (request.nextUrl.searchParams.get("format") === "json") {
    return new NextResponse(JSON.stringify({ source: "shopify-b2b-draft-orders", generatedAt: new Date().toISOString(), orders: feedToErpJson(feed.orders) }, null, 2), {
      headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="erp-orders-${date}.json"`, "Cache-Control": "no-store" },
    });
  }
  return new NextResponse(feedToCsv(feed.orders), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="erp-orders-${date}.csv"`, "Cache-Control": "no-store" },
  });
}

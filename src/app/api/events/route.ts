import { z } from "zod";
import { db } from "@/lib/db";
import { ADD_SOURCES, CLIENT_EVENTS } from "@/lib/analytics/events";

// Everything is whitelisted: unknown event types, odd ids or extra fields are rejected.
const Body = z
  .object({
    type: z.enum(CLIENT_EVENTS),
    sessionId: z.string().uuid(),
    productHandle: z.string().regex(/^[a-z0-9-]{1,80}$/).optional(),
    source: z.enum(ADD_SOURCES).optional(),
    count: z.number().int().min(1).max(20).optional(),
  })
  .strict();

const WINDOW_MS = 60_000;
const LIMIT = 120;
const hits = new Map<string, number[]>();

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (recent.length > LIMIT) return new Response(null, { status: 429 });

  let parsed;
  try {
    parsed = Body.safeParse(JSON.parse(await req.text()));
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!parsed.success) return new Response(null, { status: 400 });

  const { type, sessionId, productHandle, source, count } = parsed.data;
  const metadata = source || count ? { ...(source ? { source } : {}), ...(count ? { count } : {}) } : undefined;
  try {
    await db.event.create({ data: { type, sessionId, productHandle, metadata } });
  } catch (err) {
    console.error("[events] write failed", err instanceof Error ? err.message : err);
  }
  return new Response(null, { status: 204 });
}

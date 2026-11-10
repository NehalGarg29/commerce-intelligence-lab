import { z } from "zod";
import { runAdvisor } from "@/lib/advisor/engine";

const Body = z.object({
  message: z.string().trim().min(1).max(500),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(1500) }))
    .max(10)
    .default([]),
});

// Simple in-memory limiter (per server instance): 20 questions per 5 minutes per IP.
// Good enough for a demo; production would use a shared store such as Redis.
const WINDOW_MS = 5 * 60_000;
const LIMIT = 20;
const hits = new Map<string, number[]>();

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > LIMIT;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) {
    return Response.json({ error: "Too many questions in a short time. Please wait a few minutes." }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Please send a message between 1 and 500 characters." }, { status: 400 });
  }

  try {
    const reply = await runAdvisor(parsed.data.message, parsed.data.history);
    return Response.json(reply, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[advisor] request failed", err);
    return Response.json({ error: "The advisor couldn't answer right now. Please try again." }, { status: 500 });
  }
}

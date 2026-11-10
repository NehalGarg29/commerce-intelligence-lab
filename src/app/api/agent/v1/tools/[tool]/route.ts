import { randomUUID } from "node:crypto";
import { authenticate, rateLimit } from "@/lib/agent-api/auth";
import { createToolContext, runTool, TOOL_INPUTS, ToolInputError } from "@/lib/advisor/tools";
import { createAgentCart } from "@/lib/cart";
import { db } from "@/lib/db";

type Params = { params: Promise<{ tool: string }> };

function error(status: number, code: string, message: string, requestId: string, headers: HeadersInit = {}) {
  return Response.json({ ok: false, error: { code, message }, meta: { requestId } }, { status, headers });
}

export async function POST(req: Request, { params }: Params) {
  const requestId = randomUUID();
  const started = Date.now();
  const { tool } = await params;

  const caller = await authenticate(req);
  if (!caller) return error(401, "unauthorized", "Send a valid key as 'Authorization: Bearer lumen_sk_...'.", requestId);

  const limit = rateLimit(caller.id);
  const limitHeaders = { "X-RateLimit-Limit": "60", "X-RateLimit-Remaining": String(limit.remaining) };
  if (!limit.ok) {
    return error(429, "rate_limited", "Too many calls. Try again shortly.", requestId, {
      ...limitHeaders,
      "Retry-After": String(Math.ceil(limit.resetMs / 1000)),
    });
  }

  if (!(tool in TOOL_INPUTS)) return error(404, "unknown_tool", `No tool named "${tool}". See GET /api/agent/v1/tools.`, requestId, limitHeaders);

  let input: unknown;
  try {
    input = await req.json();
  } catch {
    return error(400, "invalid_json", "The request body must be JSON.", requestId, limitHeaders);
  }

  let status = 200;
  try {
    const ctx = await createToolContext();
    let data = await runTool(tool, input, ctx);

    // For agents, a prepared bag becomes a real Shopify cart with a checkout link.
    if (tool === "prepareCart" && ctx.lastCart) {
      const cart = await createAgentCart(
        ctx.lastCart.lines.map((l) => ({ merchandiseId: l.variantId, quantity: l.quantity })),
        caller.name
      );
      data = { ...(data as object), checkoutUrl: cart.checkoutUrl, note: "Share this link with the shopper to review and pay." };
    }

    return Response.json(
      { ok: true, tool, data, meta: { requestId, durationMs: Date.now() - started, dataset: "demo" } },
      { headers: { ...limitHeaders, "Cache-Control": "no-store" } }
    );
  } catch (err) {
    if (err instanceof ToolInputError) {
      status = 400;
      return error(400, "invalid_input", err.message, requestId, limitHeaders);
    }
    status = 500;
    console.error(`[agent-api] ${tool} failed`, err);
    return error(500, "internal_error", "The tool failed. Please try again.", requestId, limitHeaders);
  } finally {
    // Usage analytics: which tools agents use and how often they fail. No inputs stored.
    db.event
      .create({
        data: {
          type: "agent_api_call",
          sessionId: caller.prefix,
          metadata: { tool, status, durationMs: Date.now() - started },
        },
      })
      .catch(() => {});
  }
}

// Pure functions that turn raw events into the numbers on /insights.
// Counting is per session (a visit), not per event, so refreshes don't inflate funnels.

export type EventRow = {
  sessionId: string;
  type: string;
  productHandle: string | null;
  createdAt: Date;
  metadata: unknown;
};

export type RunRow = { mode: string; latencyMs: number; toolTrace: unknown; createdAt: Date };

const meta = (e: EventRow) => (e.metadata && typeof e.metadata === "object" ? (e.metadata as Record<string, unknown>) : {});

export const rate = (part: number, whole: number) => (whole > 0 ? part / whole : 0);

export function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function computeInsights(events: EventRow[], runs: RunRow[], days: number, now = new Date()) {
  const shopper = events.filter((e) => e.type !== "agent_api_call");
  const agent = events.filter((e) => e.type === "agent_api_call");

  // Sessions and what each one did
  const sessions = new Map<string, Set<string>>();
  for (const e of shopper) {
    const set = sessions.get(e.sessionId) ?? new Set<string>();
    set.add(e.type);
    sessions.set(e.sessionId, set);
  }
  const did = (type: string) => [...sessions.values()].filter((s) => s.has(type)).length;
  const total = sessions.size;
  const viewed = did("product_view");
  const added = did("add_to_cart");
  const checkout = did("checkout_start");

  // Advisor-assisted vs unassisted add-to-bag rate
  const assisted = [...sessions.values()].filter((s) => s.has("advisor_query"));
  const unassisted = [...sessions.values()].filter((s) => !s.has("advisor_query"));
  const assistedRate = rate(assisted.filter((s) => s.has("add_to_cart")).length, assisted.length);
  const unassistedRate = rate(unassisted.filter((s) => s.has("add_to_cart")).length, unassisted.length);

  // Daily sessions (first event of each session decides its day)
  const firstSeen = new Map<string, Date>();
  for (const e of shopper) {
    const prev = firstSeen.get(e.sessionId);
    if (!prev || e.createdAt < prev) firstSeen.set(e.sessionId, e.createdAt);
  }
  const daily: { day: string; sessions: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000);
    daily.push({ day: dayKey(d), sessions: 0 });
  }
  for (const d of firstSeen.values()) {
    const row = daily.find((r) => r.day === dayKey(d));
    if (row) row.sessions += 1;
  }

  // Products: views and adds
  const byProduct = new Map<string, { views: number; adds: number }>();
  for (const e of shopper) {
    if (!e.productHandle || (e.type !== "product_view" && e.type !== "add_to_cart")) continue;
    const row = byProduct.get(e.productHandle) ?? { views: 0, adds: 0 };
    if (e.type === "product_view") row.views += 1;
    else row.adds += 1;
    byProduct.set(e.productHandle, row);
  }
  const products = [...byProduct.entries()]
    .map(([handle, r]) => ({ handle, ...r, conversion: rate(r.adds, r.views) }))
    .sort((a, b) => b.views - a.views);

  // Add-to-bag sources
  const sources = new Map<string, number>();
  for (const e of shopper.filter((x) => x.type === "add_to_cart")) {
    const s = String(meta(e).source ?? "product_page");
    sources.set(s, (sources.get(s) ?? 0) + 1);
  }

  // Agent API usage
  const agentTools = new Map<string, number>();
  let agentErrors = 0;
  for (const e of agent) {
    const m = meta(e);
    agentTools.set(String(m.tool ?? "unknown"), (agentTools.get(String(m.tool ?? "unknown")) ?? 0) + 1);
    if (Number(m.status) >= 400) agentErrors += 1;
  }

  // Advisor runs
  const toolUse = new Map<string, number>();
  for (const r of runs) {
    for (const step of Array.isArray(r.toolTrace) ? (r.toolTrace as { kind?: string; name?: string }[]) : []) {
      if (step.kind === "tool" && step.name) toolUse.set(step.name, (toolUse.get(step.name) ?? 0) + 1);
    }
  }
  const latencies = runs.map((r) => r.latencyMs).sort((a, b) => a - b);

  return {
    hasDemoData: events.some((e) => meta(e).demo === true),
    funnel: { total, viewed, added, checkout },
    advisor: {
      assistedSessions: assisted.length,
      assistedRate,
      unassistedRate,
      runs: runs.length,
      aiShare: rate(runs.filter((r) => r.mode === "ai").length, runs.length),
      medianLatencyMs: latencies.length ? latencies[Math.floor(latencies.length / 2)] : 0,
      toolUse: [...toolUse.entries()].sort((a, b) => b[1] - a[1]),
    },
    daily,
    products,
    sources: [...sources.entries()].sort((a, b) => b[1] - a[1]),
    agent: { calls: agent.length, errors: agentErrors, tools: [...agentTools.entries()].sort((a, b) => b[1] - a[1]) },
  };
}

export type Insights = ReturnType<typeof computeInsights>;

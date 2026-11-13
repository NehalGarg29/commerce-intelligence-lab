import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { FlaskConical, Info } from "lucide-react";
import { db } from "@/lib/db";
import { getProducts } from "@/lib/catalog";
import { computeInsights, rate } from "@/lib/analytics/insights";
import { requireMerchant } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Insights · Afterglow",
  robots: { index: false, follow: false },
};

const DAYS = 14;
const pct = (n: number) => `${Math.round(n * 1000) / 10}%`;
const SOURCE_LABELS: Record<string, string> = { product_page: "Product page", advisor: "Advisor bag", ritual: "Ritual set" };

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-3xl border border-lavender-100 bg-white p-6">
      <p className="text-[12px] text-ink-muted">{label}</p>
      <p className="mt-2 font-display text-4xl tracking-tight text-plum-800">{value}</p>
      {note && <p className="mt-1.5 text-[12px] text-ink-muted">{note}</p>}
    </div>
  );
}

// Horizontal bars, one series: value labels are always visible, so the chart
// never relies on colour or hover to be read.
function BarList({ rows, format = (n: number) => String(n) }: { rows: { label: string; value: number; note?: string }[]; format?: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="text-[14px] text-ink-muted">No data yet.</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto] items-center gap-3 text-[13px]">
          <span className="truncate text-ink">{r.label}</span>
          <span className="h-3 overflow-hidden rounded-full bg-lavender-50" aria-hidden="true">
            <span className="block h-full rounded-full bg-plum-700" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="text-right tabular-nums text-ink">
            {format(r.value)}
            {r.note && <span className="ml-1.5 text-ink-muted">{r.note}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Panel({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-lavender-100 bg-white p-6 md:p-7">
      <h2 className="font-display text-xl text-ink">{title}</h2>
      {sub && <p className="mt-1 text-[13px] text-ink-muted">{sub}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

// Data loading lives outside the component (it reads the clock and the database).
async function loadInsights() {
  await connection(); // always live, never prerendered
  const now = new Date();
  const since = new Date(now.getTime() - DAYS * 86_400_000);
  const [events, runs, products] = await Promise.all([
    db.event.findMany({
      where: { createdAt: { gte: since } },
      select: { sessionId: true, type: true, productHandle: true, createdAt: true, metadata: true },
    }),
    db.advisorRun.findMany({ where: { createdAt: { gte: since } }, select: { mode: true, latencyMs: true, toolTrace: true, createdAt: true } }),
    getProducts(),
  ]);
  return { i: computeInsights(events, runs, DAYS, now), products };
}

async function Dashboard() {
  await requireMerchant("/insights");
  const { i, products } = await loadInsights();
  const title = (h: string) => products.find((p) => p.handle === h)?.title ?? h;
  const f = i.funnel;
  const lift = i.advisor.unassistedRate > 0 ? i.advisor.assistedRate / i.advisor.unassistedRate : 0;
  const maxDaily = Math.max(1, ...i.daily.map((d) => d.sessions));

  return (
    <>
      {i.hasDemoData && (
        <p className="mt-6 flex items-center gap-2 rounded-2xl bg-[#FBEADD] px-4 py-3 text-[13px] text-[#8A4B0F]">
          <FlaskConical size={15} aria-hidden="true" /> Includes simulated demo traffic (seeded), plus any real visits to this
          prototype.
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Sessions" value={f.total.toLocaleString()} note={`Last ${DAYS} days`} />
        <Tile label="Viewed → added to bag" value={pct(rate(f.added, f.viewed))} note={`${f.added} of ${f.viewed} sessions`} />
        <Tile label="Bag → started checkout" value={pct(rate(f.checkout, f.added))} note={`${f.checkout} of ${f.added} sessions`} />
        <Tile
          label="Add-to-bag rate with advisor"
          value={pct(i.advisor.assistedRate)}
          note={`vs ${pct(i.advisor.unassistedRate)} without${lift ? ` · ${lift.toFixed(1)}× lift` : ""}`}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Funnel" sub="Sessions reaching each step">
          <BarList
            rows={[
              { label: "Visited", value: f.total },
              { label: "Viewed a product", value: f.viewed, note: pct(rate(f.viewed, f.total)) },
              { label: "Added to bag", value: f.added, note: pct(rate(f.added, f.total)) },
              { label: "Started checkout", value: f.checkout, note: pct(rate(f.checkout, f.total)) },
            ]}
          />
        </Panel>

        <Panel title="Sessions per day" sub={`Last ${DAYS} days`}>
          <div className="flex h-44 items-end gap-1.5" role="img" aria-label={`Daily sessions, peak ${maxDaily}`}>
            {i.daily.map((d) => (
              <div key={d.day} className="group relative flex h-full flex-1 items-end">
                <div
                  className="w-full rounded-t-[4px] bg-plum-700 transition group-hover:bg-plum-800"
                  style={{ height: `${(d.sessions / maxDaily) * 100}%`, minHeight: d.sessions ? 2 : 0 }}
                />
                <span className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-plum-900 px-2 py-1 text-[11px] text-ivory group-hover:block">
                  {d.day.slice(5)} · {d.sessions}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-ink-muted">
            <span>{i.daily[0]?.day.slice(5)}</span>
            <span>{i.daily[i.daily.length - 1]?.day.slice(5)}</span>
          </div>
        </Panel>

        <Panel
          title="AI advisor"
          sub={`${i.advisor.runs} answers · ${pct(i.advisor.aiShare)} by AI, the rest by fallback rules · median ${(i.advisor.medianLatencyMs / 1000).toFixed(1)}s`}
        >
          <p className="mb-3 text-[12px] text-ink-muted">Tool calls made by the advisor</p>
          <BarList rows={i.advisor.toolUse.map(([label, value]) => ({ label, value }))} />
        </Panel>

        <Panel title="Where add-to-bag happens">
          <BarList rows={i.sources.map(([s, value]) => ({ label: SOURCE_LABELS[s] ?? s, value }))} />
          <p className="mt-6 mb-3 text-[12px] text-ink-muted">
            Agent API · {i.agent.calls} calls{i.agent.calls ? ` · ${pct(rate(i.agent.errors, i.agent.calls))} errors` : ""}
          </p>
          <BarList rows={i.agent.tools.map(([label, value]) => ({ label, value }))} />
        </Panel>
      </div>

      <section className="mt-5 overflow-x-auto rounded-3xl border border-lavender-100 bg-white">
        <table className="w-full min-w-[560px] text-[14px]">
          <caption className="px-6 pt-6 text-left font-display text-xl text-ink">Products</caption>
          <thead>
            <tr className="border-b border-lavender-100 text-left text-[12px] text-ink-muted">
              <th className="px-6 py-3 font-normal">Product</th>
              <th className="px-6 py-3 text-right font-normal">Views</th>
              <th className="px-6 py-3 text-right font-normal">Added to bag</th>
              <th className="px-6 py-3 text-right font-normal">View → bag</th>
            </tr>
          </thead>
          <tbody>
            {i.products.slice(0, 12).map((p) => (
              <tr key={p.handle} className="border-b border-lavender-100 last:border-0">
                <td className="px-6 py-3 text-ink">{title(p.handle)}</td>
                <td className="px-6 py-3 text-right tabular-nums">{p.views}</td>
                <td className="px-6 py-3 text-right tabular-nums">{p.adds}</td>
                <td className="px-6 py-3 text-right tabular-nums">{pct(p.conversion)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

export default function InsightsPage() {
  return (
    <main className="mx-auto max-w-7xl px-5 pb-16 pt-10 md:px-12 md:pt-14">
      <p className="text-[11px] tracking-[0.2em] text-ink-muted">INTERNAL · MERCHANT VIEW</p>
      <h1 className="mt-3 font-display text-5xl tracking-tight text-plum-800">Insights</h1>
      <p className="mt-3 flex items-start gap-2 text-[14px] text-ink-muted">
        <Info size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
        Anonymous, per-visit counts. No personal data and no advisor questions are stored.
      </p>
      <Suspense fallback={<div className="mt-6 h-96 animate-pulse rounded-3xl bg-lavender-100/60" />}>
        <Dashboard />
      </Suspense>
    </main>
  );
}

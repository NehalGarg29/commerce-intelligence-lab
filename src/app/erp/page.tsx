import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import {
  ArrowRight,
  Boxes,
  ClipboardList,
  Download,
  FlaskConical,
  History,
  PackageCheck,
  RotateCcw,
  Send,
  Shuffle,
  Store,
  Warehouse,
} from "lucide-react";
import { requireMerchant } from "@/lib/auth/session";
import { ERP_SCOPES, loadOrderFeed, loadStockComparison, recentSyncLog } from "@/lib/erp";
import { STATUS_META, summarize } from "@/lib/erp/compare";
import { exportOrderAction, resetErpDemoAction, simulateWarehouseAction } from "@/app/actions/erp";
import { StockTable, type StockRowView } from "@/components/erp/stock-table";
import { SubmitButton } from "@/components/erp/submit-button";

export const metadata: Metadata = {
  title: "ERP sync · Lumen Atelier",
  robots: { index: false, follow: false },
};

const money = (n: number, currency = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
const shortDate = (d: Date | string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const when = (d: Date) => new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

function Tile({ label, value, note, tone = "plain" }: { label: string; value: string; note?: string; tone?: "plain" | "critical" | "warning" }) {
  const color = tone === "critical" ? "text-[#9A1F1F]" : tone === "warning" ? "text-[#8A4B0F]" : "text-plum-800";
  return (
    <div className="rounded-3xl border border-lavender-100 bg-white p-6">
      <p className="text-[12px] text-ink-muted">{label}</p>
      <p className={`mt-2 font-display text-4xl tracking-tight ${color}`}>{value}</p>
      {note && <p className="mt-1.5 text-[12px] text-ink-muted">{note}</p>}
    </div>
  );
}

function Panel({ title, sub, actions, children, flush }: { title: string; sub?: string; actions?: React.ReactNode; children: React.ReactNode; flush?: boolean }) {
  return (
    <section className="rounded-3xl border border-lavender-100 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-4 px-6 pt-6 md:px-7">
        <div>
          <h2 className="font-display text-xl text-ink">{title}</h2>
          {sub && <p className="mt-1 max-w-2xl text-[13px] text-ink-muted">{sub}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      <div className={flush ? "mt-5" : "px-6 pb-6 pt-5 md:px-7"}>{children}</div>
    </section>
  );
}

function Flow() {
  const node = "flex items-center gap-2 rounded-2xl bg-lavender-50 px-4 py-3 text-[13px] text-plum-800";
  return (
    <div className="mt-8 grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
      <div className={node}>
        <Warehouse size={17} aria-hidden="true" />
        <span>
          <b className="font-medium">Warehouse (ERP)</b>
          <br />
          stock, factory POs, invoicing
        </span>
      </div>
      <ArrowRight size={16} className="mx-auto rotate-90 text-ink-muted md:rotate-0" aria-hidden="true" />
      <div className={node}>
        <Shuffle size={17} aria-hidden="true" />
        <span>
          <b className="font-medium">This sync</b>
          <br />
          compare, push stock, export orders
        </span>
      </div>
      <ArrowRight size={16} className="mx-auto rotate-90 text-ink-muted md:rotate-0" aria-hidden="true" />
      <div className={node}>
        <Store size={17} aria-hidden="true" />
        <span>
          <b className="font-medium">Shopify</b>
          <br />
          DTC store + B2B portal orders
        </span>
      </div>
    </div>
  );
}

function SetupNotice({ message, scopes }: { message: string; scopes?: boolean }) {
  return (
    <div className="mt-8 rounded-3xl border border-lavender-100 bg-white p-7">
      <p className="font-display text-xl text-ink">Connect Shopify inventory</p>
      <p className="mt-2 text-[14px] text-ink-muted">{message}</p>
      {scopes && (
        <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-[14px] text-ink">
          <li>
            Shopify Dev Dashboard → your app → <b>Versions</b> → create a new version and add the scopes <code className="rounded bg-lavender-50 px-1.5">{ERP_SCOPES}</code>{" "}
            (keep the existing ones).
          </li>
          <li>Release the version, then uninstall and reinstall the app on the store so the new permissions are granted.</li>
          <li>Restart the dev server (the access token is cached in memory) and reload this page.</li>
        </ol>
      )}
    </div>
  );
}

async function loadErpPage() {
  await connection(); // live data, never prerendered
  const [stock, feed, log] = await Promise.all([loadStockComparison(), loadOrderFeed(), recentSyncLog()]);
  return { stock, feed, log };
}

async function ErpDashboard() {
  await requireMerchant("/erp");
  const { stock, feed, log } = await loadErpPage();

  if (!stock.ok) return <SetupNotice message={stock.message} scopes={stock.reason === "missing_scope"} />;

  const sum = summarize(stock.rows);
  const incomingUnits = stock.rows.reduce((n, r) => n + (r.erp?.incoming ?? 0), 0);
  const nextEta = stock.rows
    .map((r) => r.erp?.incomingEta)
    .filter((d): d is Date => !!d)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  const view: StockRowView[] = stock.rows.map((r) => ({
    variantId: r.variantId,
    title: r.title,
    sku: r.sku,
    onHand: r.erp?.onHand ?? null,
    allocated: r.erp?.allocated ?? null,
    erpAvailable: r.erpAvailable,
    shopify: r.available,
    diff: r.diff,
    incoming: r.erp?.incoming ?? 0,
    incomingEta: r.erp?.incomingEta ? shortDate(r.erp.incomingEta) : null,
    status: r.status,
    statusLabel: STATUS_META[r.status].label,
    statusHelp: STATUS_META[r.status].help,
  }));

  const ghost =
    "inline-flex items-center gap-2 rounded-full border border-lavender-100 bg-white px-4 py-2 text-[13px] text-plum-800 transition hover:border-mauve-400/60 hover:bg-lavender-50";

  return (
    <>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="SKUs in sync" value={`${sum.inSync}/${sum.total - sum.untracked}`} note={sum.untracked ? `${sum.untracked} not tracked` : "All SKUs tracked"} />
        <Tile
          label="Oversell risk"
          value={`${sum.unitsAtRisk} units`}
          note={`${sum.oversell} SKU${sum.oversell === 1 ? "" : "s"}: Shopify promises stock the warehouse doesn't have`}
          tone={sum.oversell ? "critical" : "plain"}
        />
        <Tile
          label="Hidden stock"
          value={`${sum.unitsHidden} units`}
          note={`${sum.hidden} SKU${sum.hidden === 1 ? "" : "s"}: in the warehouse but not for sale online`}
          tone={sum.hidden ? "warning" : "plain"}
        />
        <Tile label="Arriving from the factory" value={`${incomingUnits} units`} note={nextEta ? `Next delivery ${shortDate(nextEta)}` : "No open purchase orders"} />
      </div>

      <div className="mt-5">
        <Panel
          title="Stock: warehouse vs Shopify"
          sub="The warehouse is the source of truth. “ERP sellable” is on hand minus units reserved for retailer orders. Pushing sets Shopify to that number, with a compare-and-swap check so a sale in the meantime is never overwritten."
          actions={
            <form action={simulateWarehouseAction}>
              <SubmitButton className={ghost} pendingLabel="Moving stock…">
                <Shuffle size={15} aria-hidden="true" /> Simulate warehouse activity
              </SubmitButton>
            </form>
          }
          flush
        >
          <StockTable rows={view} />
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel
          title="B2B orders → ERP"
          sub="Orders placed in the retail partner portal (Shopify draft orders tagged lumen-portal), in the shape an ERP imports as sales orders. Sending one reserves its stock in the warehouse."
          actions={
            feed.ok && feed.orders.length ? (
              <>
                <a href="/api/erp/orders?format=csv" className={ghost}>
                  <Download size={15} aria-hidden="true" /> CSV
                </a>
                <a href="/api/erp/orders?format=json" className={ghost}>
                  <Download size={15} aria-hidden="true" /> JSON
                </a>
              </>
            ) : null
          }
        >
          {!feed.ok ? (
            <p className="text-[14px] text-ink-muted">{feed.message}</p>
          ) : feed.orders.length === 0 ? (
            <p className="text-[14px] text-ink-muted">No portal orders yet. Place one from a retailer&apos;s page in the retail partner portal.</p>
          ) : (
            <ul className="divide-y divide-lavender-100">
              {feed.orders.map((o) => {
                const units = o.lines.reduce((n, l) => n + l.quantity, 0);
                return (
                  <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4 first:pt-0 last:pb-0">
                    <ClipboardList size={18} className="shrink-0 text-plum-700" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] text-ink">
                        <b className="font-medium">{o.name}</b> · {o.company ?? "Retailer"}
                        {o.location ? `, ${o.location}` : ""}
                      </p>
                      <p className="text-[12px] text-ink-muted">
                        {shortDate(o.createdAt)} · {units} units · {money(o.total, o.currency)}
                        {o.paymentTerms ? ` · ${o.paymentTerms}` : ""}
                        {o.poNumber ? ` · PO ${o.poNumber}` : ""}
                      </p>
                    </div>
                    {o.exportedAt ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E4F2E7] px-3 py-1 text-[12px] text-[#22603A]">
                        <PackageCheck size={13} aria-hidden="true" /> Sent to ERP {shortDate(o.exportedAt)}
                      </span>
                    ) : (
                      <form action={exportOrderAction}>
                        <input type="hidden" name="draftOrderId" value={o.id} />
                        <SubmitButton
                          pendingLabel="Sending…"
                          className="inline-flex items-center gap-1.5 rounded-full bg-plum-800 px-4 py-1.5 text-[12px] font-medium text-ivory transition hover:bg-plum-900"
                        >
                          <Send size={13} aria-hidden="true" /> Send to ERP
                        </SubmitButton>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel
          title="Sync log"
          actions={
            <form action={resetErpDemoAction}>
              <SubmitButton className={ghost} pendingLabel="Resetting…">
                <RotateCcw size={15} aria-hidden="true" /> Reset demo
              </SubmitButton>
            </form>
          }
        >
          {log.length === 0 ? (
            <p className="text-[14px] text-ink-muted">Nothing yet. Pushes, order exports and warehouse activity appear here.</p>
          ) : (
            <ol className="space-y-4">
              {log.map((e) => (
                <li key={e.id} className="flex gap-3 text-[13px]">
                  <History size={15} className="mt-0.5 shrink-0 text-ink-muted" aria-hidden="true" />
                  <div>
                    <p className="text-ink">{e.summary}</p>
                    <p className="text-[11px] text-ink-muted">
                      {when(e.createdAt)} · {e.actor}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <section className="mt-5 rounded-3xl bg-lavender-50 p-6 md:p-7">
        <p className="flex items-center gap-2 font-display text-xl text-plum-800">
          <Boxes size={19} aria-hidden="true" /> In production
        </p>
        <ul className="mt-3 grid gap-2 text-[14px] leading-relaxed text-ink md:grid-cols-2">
          <li>The warehouse table here stands in for SAP, NetSuite or Dynamics, connected through middleware such as MuleSoft or Celigo.</li>
          <li>Stock would sync on a schedule (e.g. every 15 minutes) and on ERP events, not by a button. The button just makes it visible.</li>
          <li>Orders would flow through Shopify webhooks (orders/create, draft_orders/update) into ERP sales orders, with invoices and tracking coming back.</li>
          <li>The rules stay the same: the ERP owns stock, Shopify owns the shopping experience, and every write is checked, idempotent and logged.</li>
        </ul>
      </section>
    </>
  );
}

export default function ErpPage() {
  return (
    <main className="mx-auto max-w-7xl px-5 pb-16 pt-10 md:px-12 md:pt-14">
      <p className="text-[11px] tracking-[0.2em] text-ink-muted">INTERNAL · MERCHANT VIEW</p>
      <h1 className="mt-3 font-display text-5xl tracking-tight text-plum-800">ERP sync</h1>
      <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-ink-muted">
        Keeps Shopify honest against the warehouse, and hands every retailer order to the back office.
      </p>
      <p className="mt-4 inline-flex items-start gap-2 rounded-2xl bg-[#FBEADD] px-4 py-3 text-[13px] text-[#8A4B0F]">
        <FlaskConical size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
        The warehouse (ERP) is a fictional simulation. Shopify stock and B2B orders are live, and pushes really update Shopify.
      </p>
      <Flow />
      <Suspense fallback={<div className="mt-8 h-96 animate-pulse rounded-3xl bg-lavender-100/60" />}>
        <ErpDashboard />
      </Suspense>
    </main>
  );
}

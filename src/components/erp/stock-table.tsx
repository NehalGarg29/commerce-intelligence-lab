"use client";

import { useActionState, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleDashed, EyeOff, Loader2, UploadCloud } from "lucide-react";
import { pushToShopifyAction, type ErpActionState } from "@/app/actions/erp";
import type { SyncStatus } from "@/lib/erp/compare";

export type StockRowView = {
  variantId: string;
  title: string;
  sku: string;
  onHand: number | null;
  allocated: number | null;
  erpAvailable: number | null;
  shopify: number | null;
  diff: number | null;
  incoming: number;
  incomingEta: string | null;
  status: SyncStatus;
  statusLabel: string;
  statusHelp: string;
};

const TONE: Record<SyncStatus, { cls: string; Icon: typeof CheckCircle2 }> = {
  in_sync: { cls: "bg-[#E4F2E7] text-[#22603A]", Icon: CheckCircle2 },
  oversell: { cls: "bg-[#FBE3E3] text-[#9A1F1F]", Icon: AlertTriangle },
  hidden_stock: { cls: "bg-[#FBEADD] text-[#8A4B0F]", Icon: EyeOff },
  untracked: { cls: "bg-lavender-50 text-ink-muted", Icon: CircleDashed },
  missing_in_erp: { cls: "bg-lavender-50 text-ink-muted", Icon: CircleDashed },
};

const fixable = (r: StockRowView) => r.status === "oversell" || r.status === "hidden_stock";
const num = (n: number | null) => (n === null ? "–" : n.toLocaleString());

export function StockTable({ rows }: { rows: StockRowView[] }) {
  const [state, action, pending] = useActionState<ErpActionState, FormData>(pushToShopifyAction, { status: "idle", message: "" });
  // Track what the user *unticked*, so rows that become mismatched after a
  // refresh are selected by default and fixed rows simply drop out.
  const [skip, setSkip] = useState<Set<string>>(new Set());
  const [onlyIssues, setOnlyIssues] = useState(false);

  const selected = useMemo(() => rows.filter((r) => fixable(r) && !skip.has(r.variantId)), [rows, skip]);
  const visible = onlyIssues ? rows.filter((r) => r.status !== "in_sync") : rows;
  const toggle = (id: string) =>
    setSkip((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 px-6 pb-4">
        <form action={action}>
          <input type="hidden" name="rows" value={JSON.stringify(selected.map((r) => ({ variantId: r.variantId, seen: r.shopify })))} />
          <button
            type="submit"
            disabled={pending || selected.length === 0}
            className="inline-flex items-center gap-2 rounded-full bg-plum-800 px-5 py-2.5 text-[14px] font-medium text-ivory transition hover:bg-plum-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <UploadCloud size={16} aria-hidden="true" />}
            {selected.length ? `Push ${selected.length} to Shopify` : "Nothing to push"}
          </button>
        </form>
        <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-ink-muted">
          <input type="checkbox" checked={onlyIssues} onChange={(e) => setOnlyIssues(e.target.checked)} className="accent-plum-700" />
          Only show mismatches
        </label>
        {state.message && (
          <p role="status" className={`text-[13px] ${state.status === "error" ? "text-[#9A1F1F]" : "text-[#22603A]"}`}>
            {state.message}
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-[14px]">
          <thead>
            <tr className="border-y border-lavender-100 text-left text-[12px] text-ink-muted">
              <th className="w-10 px-6 py-3 font-normal">
                <span className="sr-only">Include in push</span>
              </th>
              <th className="px-3 py-3 font-normal">Product</th>
              <th className="px-3 py-3 text-right font-normal" title="Physically in the warehouse">On hand</th>
              <th className="px-3 py-3 text-right font-normal" title="Reserved for retailer orders not yet shipped">Reserved</th>
              <th className="px-3 py-3 text-right font-normal" title="On hand minus reserved: what can really be sold">ERP sellable</th>
              <th className="px-3 py-3 text-right font-normal">Shopify</th>
              <th className="px-3 py-3 text-right font-normal">Difference</th>
              <th className="px-3 py-3 text-right font-normal">Incoming</th>
              <th className="px-6 py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => {
              const { cls, Icon } = TONE[r.status];
              return (
                <tr key={r.variantId} className="border-b border-lavender-100 last:border-0">
                  <td className="px-6 py-3">
                    {fixable(r) && (
                      <input
                        type="checkbox"
                        aria-label={`Include ${r.title}`}
                        checked={!skip.has(r.variantId)}
                        onChange={() => toggle(r.variantId)}
                        className="accent-plum-700"
                      />
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-ink">{r.title}</p>
                    <p className="text-[11px] tracking-wide text-ink-muted">{r.sku}</p>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{num(r.onHand)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-ink-muted">{num(r.allocated)}</td>
                  <td className="px-3 py-3 text-right font-medium tabular-nums">{num(r.erpAvailable)}</td>
                  <td className="px-3 py-3 text-right font-medium tabular-nums">{num(r.shopify)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {r.diff === null || r.diff === 0 ? <span className="text-ink-muted">0</span> : r.diff > 0 ? `+${r.diff}` : r.diff}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-ink-muted">
                    {r.incoming ? (
                      <span title={r.incomingEta ? `Factory PO, due ${r.incomingEta}` : "Factory PO"}>
                        +{r.incoming}
                        {r.incomingEta && <span className="ml-1 text-[11px]">{r.incomingEta}</span>}
                      </span>
                    ) : (
                      "–"
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <span title={r.statusHelp} className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] ${cls}`}>
                      <Icon size={13} aria-hidden="true" /> {r.statusLabel}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUp, Info, ShieldCheck, ShoppingBag, Sparkles, Star, TriangleAlert, Wrench } from "lucide-react";
import { addAdvisorBagAction, type AddToBagState } from "@/app/actions/cart";
import type { AdvisorReply, ChatTurn, TraceStep } from "@/lib/advisor/types";
import { formatPrice } from "@/lib/format";
import { track } from "@/lib/analytics/track";

type Turn =
  | { role: "user"; content: string }
  | { role: "assistant"; reply: AdvisorReply }
  | { role: "error"; content: string };

const EXAMPLES = [
  "A quiet first vibrator under $100",
  "A gift for my partner, around $80",
  "Something for us to try together",
  "Which lube is safe with silicone toys?",
  "Ember Mini or Petite Wand for travel?",
];

const LOADING = ["Searching the catalog…", "Checking live stock…", "Reading demo reviews…", "Applying store rules…"];

function ModeBadge({ reply }: { reply: AdvisorReply }) {
  return reply.mode === "ai" ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-lavender-50 px-2.5 py-1 text-[11px] text-plum-800">
      <Sparkles size={12} aria-hidden="true" /> AI · {reply.model}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FBEADD] px-2.5 py-1 text-[11px] text-[#8A4B0F]">
      <ShieldCheck size={12} aria-hidden="true" /> Fallback mode · fixed rules, no AI
    </span>
  );
}

const STEP_ICON = { tool: Wrench, rule: ShieldCheck, model: Sparkles } as const;

function Trace({ steps, latencyMs }: { steps: TraceStep[]; latencyMs: number }) {
  const tools = steps.filter((s) => s.kind === "tool").length;
  const rules = steps.filter((s) => s.kind === "rule").length;
  return (
    <details className="group mt-4 rounded-2xl border border-lavender-100 bg-white/70 text-[13px]">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-ink-muted">
        <span>
          How this answer was made · {tools} tool {tools === 1 ? "call" : "calls"}, {rules} rule {rules === 1 ? "check" : "checks"}
        </span>
        <span className="text-[12px]">{(latencyMs / 1000).toFixed(1)}s</span>
      </summary>
      <ol className="space-y-2 border-t border-lavender-100 px-4 py-3">
        {steps.map((s, i) => {
          const Icon = STEP_ICON[s.kind];
          return (
            <li key={i} className="flex gap-3">
              <Icon size={14} className={`mt-0.5 shrink-0 ${s.ok ? "text-plum-700" : "text-[#8A4B0F]"}`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-ink">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-ink-muted"> · {s.summary}</span>
                  {s.ms !== undefined && <span className="text-ink-muted"> · {s.ms} ms</span>}
                </p>
                {s.input !== undefined && (
                  <code className="mt-1 block truncate font-mono text-[11px] text-ink-muted">{JSON.stringify(s.input)}</code>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </details>
  );
}

function CartProposalBox({ reply }: { reply: AdvisorReply }) {
  const [state, action, pending] = useActionState<AddToBagState, FormData>(addAdvisorBagAction, { status: "idle", message: "" });
  const cart = reply.cart;
  useEffect(() => {
    if (state.status === "added") track("add_to_cart", { source: "advisor", count: Math.min(cart?.lines.length ?? 1, 20) });
  }, [state, cart]);
  if (!cart) return null;
  const lines = cart.lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity }));

  return (
    <div className="mt-4 rounded-2xl border border-plum-700/20 bg-white p-5">
      <p className="text-[11px] tracking-[0.18em] text-ink-muted">
        {state.status === "added" ? "ADDED TO YOUR BAG" : "PREPARED FOR YOU · NOT IN YOUR BAG YET"}
      </p>
      <ul className="mt-3 space-y-1.5 text-[14px]">
        {cart.lines.map((l) => (
          <li key={l.variantId} className="flex justify-between gap-4">
            <span className="text-ink">
              {l.quantity} × {l.title}
              {l.variantTitle ? <span className="text-ink-muted"> · {l.variantTitle}</span> : null}
            </span>
            <span className="text-ink">{formatPrice(l.price * l.quantity, l.price * l.quantity)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-lavender-100 pt-4">
        <p className="text-[14px] text-ink">Total {formatPrice(cart.total, cart.total)}</p>
        {state.status === "added" ? (
          <Link href="/cart" className="inline-flex h-11 items-center gap-2 rounded-full bg-plum-700 px-5 text-sm font-medium text-white">
            <ShoppingBag size={16} aria-hidden="true" /> View bag
          </Link>
        ) : (
          <form action={action}>
            <input type="hidden" name="lines" value={JSON.stringify(lines)} />
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-plum-700 px-5 text-sm font-medium text-white transition hover:bg-plum-800 disabled:opacity-60"
            >
              <ShoppingBag size={16} aria-hidden="true" /> {pending ? "Adding…" : "Add to bag"}
            </button>
          </form>
        )}
      </div>
      {state.message && (
        <p role="status" className={`mt-3 text-[13px] ${state.status === "error" ? "text-[#8A4B0F]" : "text-[#2F5D36]"}`}>
          {state.message}
        </p>
      )}
    </div>
  );
}

function AssistantTurn({ reply, compact, onNavigate }: { reply: AdvisorReply; compact: boolean; onNavigate?: () => void }) {
  return (
    <div className="max-w-full">
      <ModeBadge reply={reply} />
      <p className="mt-3 whitespace-pre-line text-[16px] leading-relaxed text-ink">{reply.message}</p>

      {reply.recommendations.length > 0 && (
        <ul className={`mt-5 grid gap-3 ${compact ? "" : "sm:grid-cols-3"}`}>
          {reply.recommendations.map((r) => (
            <li key={r.handle}>
              <Link
                href={`/products/${r.handle}`}
                onClick={() => {
                  track("advisor_click", { productHandle: r.handle });
                  onNavigate?.();
                }}
                className={`group flex h-full overflow-hidden rounded-2xl border ${compact ? "" : "sm:flex-col"} border-lavender-100 bg-white transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-18px_rgba(46,15,41,0.35)]`}
              >
                <div className={`relative w-28 shrink-0 bg-lavender-50 ${compact ? "" : "sm:aspect-[4/3] sm:w-auto"}`}>
                  {r.imageUrl && <Image src={r.imageUrl} alt="" fill sizes="(min-width: 640px) 240px, 112px" className="object-cover" />}
                </div>
                <div className="flex min-w-0 flex-1 flex-col p-4">
                  <p className="text-[10px] tracking-[0.16em] text-ink-muted">{r.brand.toUpperCase()}</p>
                  <div className="mt-0.5 flex items-baseline justify-between gap-2">
                    <p className="font-display text-lg text-ink group-hover:text-plum-700">{r.title}</p>
                    <p className="shrink-0 text-[14px] text-ink">{r.price}</p>
                  </div>
                  {r.rating && (
                    <p className="mt-1 flex items-center gap-1 text-[12px] text-ink-muted">
                      <Star size={12} className="text-plum-700" fill="currentColor" strokeWidth={0} aria-hidden="true" />
                      {r.rating.average.toFixed(1)} ({r.rating.count})
                    </p>
                  )}
                  <p className="mt-2 text-[13px] leading-snug text-ink-muted">{r.reason}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <CartProposalBox reply={reply} />

      {reply.notices.map((n) => (
        <p key={n} className="mt-3 flex items-start gap-2 text-[13px] text-[#8A4B0F]">
          <TriangleAlert size={14} className="mt-0.5 shrink-0" aria-hidden="true" /> {n}
        </p>
      ))}

      <Trace steps={reply.trace} latencyMs={reply.latencyMs} />
    </div>
  );
}

// ---------- Conversation state (one per chat surface) ----------

export type AdvisorConversation = {
  turns: Turn[];
  pending: boolean;
  step: number;
  ask: (text: string) => void;
};

export function useAdvisorConversation(): AdvisorConversation {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState(false);
  const [step, setStep] = useState(0);
  const turnsRef = useRef<Turn[]>([]);
  const pendingRef = useRef(false);

  useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);

  useEffect(() => {
    if (!pending) return;
    const id = setInterval(() => setStep((s) => (s + 1) % LOADING.length), 1400);
    return () => clearInterval(id);
  }, [pending]);

  const ask = useCallback(async (text: string) => {
    const message = text.trim().slice(0, 500);
    if (!message || pendingRef.current) return;
    pendingRef.current = true;
    track("advisor_query");
    const history: ChatTurn[] = turnsRef.current
      .flatMap((t): ChatTurn[] =>
        t.role === "user"
          ? [{ role: "user", content: t.content }]
          : t.role === "assistant"
            ? [{ role: "assistant", content: t.reply.message }]
            : []
      )
      .slice(-8);
    setTurns((prev) => [...prev, { role: "user", content: message }]);
    setStep(0);
    setPending(true);
    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      const data = await res.json();
      setTurns((prev) => [
        ...prev,
        res.ok ? { role: "assistant", reply: data as AdvisorReply } : { role: "error", content: data.error ?? "Something went wrong." },
      ]);
    } catch {
      setTurns((prev) => [...prev, { role: "error", content: "Couldn't reach the advisor. Check your connection and try again." }]);
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }, []);

  return { turns, pending, step, ask };
}

// ---------- Chat UI, used full-page (/advisor) and in the floating widget ----------

export function AdvisorChat({
  convo,
  variant = "page",
  initialInput = "",
  onNavigate,
}: {
  convo: AdvisorConversation;
  variant?: "page" | "widget";
  initialInput?: string;
  onNavigate?: () => void;
}) {
  const { turns, pending, step, ask } = convo;
  const widget = variant === "widget";
  const [input, setInput] = useState(initialInput.slice(0, 500));
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (widget) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    else el.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, pending, widget]);

  useEffect(() => {
    if (widget) inputRef.current?.focus();
  }, [widget]);

  function submit(text: string) {
    if (!text.trim() || pending) return;
    setInput("");
    ask(text);
  }

  const form = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(input);
      }}
      className={
        widget
          ? "flex items-end gap-2 rounded-2xl border border-lavender-100 bg-white p-1.5"
          : "sticky bottom-4 mt-8 flex items-end gap-2 rounded-3xl border border-lavender-100 bg-white/90 p-2 shadow-[0_12px_40px_-20px_rgba(46,15,41,0.4)] backdrop-blur-xl"
      }
    >
      <label htmlFor={`advisor-input-${variant}`} className="sr-only">Ask the advisor</label>
      <textarea
        ref={inputRef}
        id={`advisor-input-${variant}`}
        value={input}
        onChange={(e) => setInput(e.target.value.slice(0, 500))}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit(input);
          }
        }}
        rows={1}
        placeholder="e.g. something quiet for travel, under $100"
        className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] text-ink outline-none placeholder:text-ink-muted/70"
      />
      <button
        type="submit"
        disabled={pending || !input.trim()}
        aria-label="Send"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-plum-700 text-white transition hover:bg-plum-800 disabled:opacity-40"
      >
        <ArrowUp size={18} aria-hidden="true" />
      </button>
    </form>
  );

  const disclaimer = (
    <p className={`flex items-start gap-2 leading-relaxed text-ink-muted ${widget ? "mt-2 text-[11px]" : "mt-3 text-[12px]"}`}>
      <Info size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
      AI can make mistakes; card prices and stock are live. Not medical advice. Questions aren&apos;t saved.
    </p>
  );

  return (
    <div className={widget ? "flex min-h-0 flex-1 flex-col" : "mx-auto flex max-w-3xl flex-col"}>
      <div ref={scrollRef} className={widget ? "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4" : ""}>
        {turns.length === 0 && (
          <div className={widget ? "pt-2" : "rounded-3xl bg-lavender-50 p-7 md:p-9"}>
            <p className={`font-display leading-snug text-ink ${widget ? "text-xl" : "text-2xl md:text-3xl"}`}>
              Tell me what you&apos;re looking for, in your own words.
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
              I check live prices and stock, read the demo reviews and follow the store&apos;s rules before I suggest anything.
            </p>
            <div className={`flex flex-wrap gap-2 ${widget ? "mt-4" : "mt-6"}`}>
              {EXAMPLES.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => submit(e)}
                  className="rounded-full border border-lavender-100 bg-white px-3.5 py-2 text-left text-[13px] text-ink transition hover:border-mauve-400 hover:text-plum-700"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}

        <ol className={`flex flex-col ${widget ? "mt-4 gap-6" : "mt-6 gap-8"}`} aria-live="polite">
          {turns.map((t, i) => (
            <li key={i} className={t.role === "user" ? "flex justify-end" : ""}>
              {t.role === "user" && (
                <p className="max-w-[85%] rounded-3xl rounded-br-md bg-plum-800 px-4 py-2.5 text-[15px] text-ivory">{t.content}</p>
              )}
              {t.role === "assistant" && <AssistantTurn reply={t.reply} compact={widget} onNavigate={onNavigate} />}
              {t.role === "error" && (
                <p className="flex items-start gap-2 rounded-2xl bg-[#FBEADD] px-4 py-3 text-[14px] text-[#8A4B0F]">
                  <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> {t.content}
                </p>
              )}
            </li>
          ))}
          {pending && (
            <li className="flex items-center gap-3 text-[14px] text-ink-muted">
              <span className="flex gap-1" aria-hidden="true">
                <span className="h-2 w-2 animate-bounce rounded-full bg-plum-700 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-plum-700 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-plum-700" />
              </span>
              {LOADING[step]}
            </li>
          )}
        </ol>
      </div>

      {widget ? (
        <div className="border-t border-lavender-100 bg-ivory/80 px-4 pb-3 pt-3">
          {form}
          {disclaimer}
        </div>
      ) : (
        <>
          {form}
          {disclaimer}
        </>
      )}
    </div>
  );
}

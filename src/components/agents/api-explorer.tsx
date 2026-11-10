"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, Play } from "lucide-react";

type ToolDoc = { name: string; description: string; input_schema: unknown; example: unknown };
type Result = { status: number; ms: number; body: unknown } | null;

export function ApiExplorer({ tools }: { tools: ToolDoc[] }) {
  const [selected, setSelected] = useState(tools[0]?.name ?? "");
  const [inputs, setInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(tools.map((t) => [t.name, JSON.stringify(t.example, null, 2)]))
  );
  const [apiKey, setApiKey] = useState(""); // kept in memory only, never stored
  const [result, setResult] = useState<Result>(null);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSchema, setShowSchema] = useState(false);

  const tool = tools.find((t) => t.name === selected) ?? tools[0];
  const body = inputs[selected] ?? "{}";
  let bodyValid = true;
  try {
    JSON.parse(body);
  } catch {
    bodyValid = false;
  }

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const curl = `curl -X POST ${origin}/api/agent/v1/tools/${selected} \\
  -H "Authorization: Bearer $LUMEN_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(JSON.parse(bodyValid ? body : "{}"))}'`;

  async function send() {
    setPending(true);
    const t0 = performance.now();
    try {
      const res = await fetch(`/api/agent/v1/tools/${selected}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey.trim()}` },
        body,
      });
      setResult({ status: res.status, ms: Math.round(performance.now() - t0), body: await res.json() });
    } catch {
      setResult({ status: 0, ms: 0, body: { error: "Network error" } });
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="explorer" className="mt-16">
      <h2 id="explorer" className="font-display text-3xl tracking-tight text-plum-800">Try it live</h2>
      <p className="mt-2 text-[14px] text-ink-muted">
        Create a key with <code className="rounded bg-lavender-50 px-1.5 py-0.5 text-[13px]">npm run api-key -- &quot;My agent&quot;</code>.
        The key is only held in memory on this page. Tool catalog:{" "}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a JSON endpoint, not a page */}
        <a href="/api/agent/v1/tools" className="text-plum-800 underline underline-offset-4">GET /api/agent/v1/tools</a>
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav aria-label="Tools" className="flex gap-2 overflow-x-auto lg:flex-col">
          {tools.map((t) => (
            <button
              key={t.name}
              type="button"
              onClick={() => {
                setSelected(t.name);
                setResult(null);
              }}
              aria-current={t.name === selected ? "true" : undefined}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-left font-mono text-[13px] transition ${
                t.name === selected ? "bg-plum-800 text-ivory" : "bg-white text-ink hover:bg-lavender-50"
              }`}
            >
              {t.name}
            </button>
          ))}
        </nav>

        <div className="min-w-0 rounded-3xl border border-lavender-100 bg-white p-5 md:p-7">
          <p className="font-mono text-[13px] text-ink-muted">POST /api/agent/v1/tools/{selected}</p>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">{tool?.description}</p>
          <button
            type="button"
            onClick={() => setShowSchema((s) => !s)}
            className="mt-2 text-[13px] text-plum-800 underline underline-offset-4"
          >
            {showSchema ? "Hide" : "Show"} input schema
          </button>
          {showSchema && (
            <pre className="mt-3 max-h-64 overflow-auto rounded-2xl bg-ivory p-4 font-mono text-[12px] text-ink">
              {JSON.stringify(tool?.input_schema, null, 2)}
            </pre>
          )}

          <label className="mt-6 block text-[11px] tracking-[0.18em] text-ink-muted" htmlFor="api-key">API KEY</label>
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-lavender-100 bg-ivory px-3">
            <KeyRound size={15} className="text-ink-muted" aria-hidden="true" />
            <input
              id="api-key"
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="lumen_sk_…"
              className="h-11 flex-1 bg-transparent font-mono text-[13px] outline-none"
            />
          </div>

          <label className="mt-5 block text-[11px] tracking-[0.18em] text-ink-muted" htmlFor="api-body">REQUEST BODY (JSON)</label>
          <textarea
            id="api-body"
            value={body}
            onChange={(e) => setInputs((prev) => ({ ...prev, [selected]: e.target.value }))}
            spellCheck={false}
            rows={6}
            className={`mt-2 w-full rounded-xl border bg-ivory p-3 font-mono text-[13px] outline-none ${
              bodyValid ? "border-lavender-100" : "border-[#C2410C]"
            }`}
          />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={send}
              disabled={pending || !bodyValid || !apiKey.trim()}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-plum-700 px-6 text-sm font-medium text-white transition hover:bg-plum-800 disabled:opacity-40"
            >
              <Play size={15} aria-hidden="true" /> {pending ? "Calling…" : "Send request"}
            </button>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(curl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-lavender-100 px-5 text-sm text-ink transition hover:border-mauve-400"
            >
              {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />} Copy as curl
            </button>
            {!bodyValid && <span className="text-[13px] text-[#C2410C]">Body isn&apos;t valid JSON</span>}
          </div>

          {result && (
            <div className="mt-6">
              <p className="flex items-center gap-3 text-[13px]">
                <span
                  className={`rounded-full px-2.5 py-1 font-mono ${
                    result.status >= 200 && result.status < 300 ? "bg-[#E3F0E7] text-[#1F4D30]" : "bg-[#FBEADD] text-[#8A4B0F]"
                  }`}
                >
                  {result.status || "ERR"}
                </span>
                <span className="text-ink-muted">{result.ms} ms</span>
              </p>
              <pre className="mt-3 max-h-[480px] overflow-auto rounded-2xl bg-plum-900 p-4 font-mono text-[12px] leading-relaxed text-lavender-50">
                {JSON.stringify(result.body, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

import { BadgeCheck, MessageSquareQuote, ShieldAlert } from "lucide-react";
import { getProductReviews } from "@/lib/reviews";
import { themeVerdict, type ThemeStat } from "@/lib/reviews/analyze";
import { Stars } from "./stars";

const VERDICT_STYLE = {
  praised: { text: "Mostly praised", cls: "bg-[#E7F1E8] text-[#2F5D36]" },
  criticised: { text: "Often criticised", cls: "bg-[#FBEADD] text-[#8A4B0F]" },
  mixed: { text: "Mixed", cls: "bg-lavender-50 text-plum-800" },
} as const;

function ThemeCard({ t }: { t: ThemeStat }) {
  const v = VERDICT_STYLE[themeVerdict(t)];
  return (
    <div className="flex flex-col rounded-2xl border border-lavender-100 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-lg text-ink">{t.label}</p>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${v.cls}`}>{v.text}</span>
      </div>
      <p className="mt-1 text-[13px] text-ink-muted">
        {t.mentions} {t.mentions === 1 ? "mention" : "mentions"} · {t.positive} positive
        {t.negative > 0 ? ` · ${t.negative} negative` : ""}
      </p>
      {t.evidence.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-lavender-100 pt-4">
          {[...t.evidence].sort((a) => (a.tone === "positive" ? -1 : 1)).map((e) => (
            <li key={e.reviewId} className="flex gap-2 text-[13px] leading-relaxed text-ink">
              <MessageSquareQuote
                size={14}
                className={`mt-0.5 shrink-0 ${e.tone === "positive" ? "text-[#2F5D36]" : "text-[#8A4B0F]"}`}
                aria-label={e.tone === "positive" ? "Positive mention" : "Negative mention"}
              />
              <span>
                “{e.quote}” <span className="text-ink-muted">· {e.rating}★</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export async function ReviewsSection({ handle }: { handle: string }) {
  const intel = await getProductReviews(handle);

  return (
    <section id="reviews" aria-labelledby="reviews-title" className="mt-24 scroll-mt-28">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.2em] text-ink-muted">REVIEW INTELLIGENCE</p>
          <h2 id="reviews-title" className="mt-2 font-display text-3xl tracking-tight text-plum-800 md:text-4xl">
            What customers mention
          </h2>
        </div>
        <span className="rounded-full bg-lavender-50 px-3 py-1.5 text-[12px] text-plum-800">
          Fictional demo reviews
        </span>
      </div>

      {!intel || intel.count === 0 ? (
        <p className="mt-8 rounded-2xl border border-lavender-100 bg-white p-6 text-[15px] text-ink-muted">
          No reviews yet for this product.
        </p>
      ) : (
        <>
          <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,2fr)]">
            <div className="rounded-3xl bg-lavender-50 p-7">
              <p className="font-display text-6xl text-plum-800">{intel.average.toFixed(1)}</p>
              <div className="mt-2"><Stars value={intel.average} size={18} /></div>
              <p className="mt-2 text-[14px] text-ink-muted">Based on {intel.count} reviews</p>
              <ul className="mt-6 space-y-1.5" aria-label="Rating breakdown">
                {intel.distribution.map((n, i) => (
                  <li key={i} className="flex items-center gap-3 text-[13px] text-ink-muted">
                    <span className="w-6">{5 - i}★</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white">
                      <span
                        className="block h-full rounded-full bg-plum-700"
                        style={{ width: `${(n / intel.count) * 100}%` }}
                      />
                    </span>
                    <span className="w-5 text-right">{n}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {intel.themes.slice(0, 4).map((t) => (
                <ThemeCard key={t.theme} t={t} />
              ))}
            </div>
          </div>

          <p className="mt-4 text-[12px] leading-relaxed text-ink-muted">
            Themes and their tone are worked out with fixed rules from the review text, not written by AI. Every quote above is taken from a
            real review in this demo dataset.
          </p>

          <ul className="mt-12 divide-y divide-lavender-100 border-y border-lavender-100">
            {intel.recent.slice(0, 5).map((r) => (
              <li key={r.id} className="grid gap-2 py-6 md:grid-cols-[180px_minmax(0,1fr)] md:gap-8">
                <div className="text-[13px] text-ink-muted">
                  <p className="font-medium text-ink">{r.authorName}</p>
                  {r.verified && (
                    <p className="mt-1 flex items-center gap-1 text-[#2F5D36]">
                      <BadgeCheck size={14} aria-hidden="true" /> Verified buyer
                    </p>
                  )}
                  <p className="mt-1">{dateFmt.format(new Date(r.createdAt))}</p>
                </div>
                <div>
                  <Stars value={r.rating} />
                  <p className="mt-2 font-medium text-ink">{r.title}</p>
                  <p className="mt-1 text-[15px] leading-relaxed text-ink-muted">{r.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {intel && intel.held > 0 && (
        <p className="mt-5 flex items-start gap-2 text-[12px] leading-relaxed text-ink-muted">
          <ShieldAlert size={14} className="mt-0.5 shrink-0 text-[#8A4B0F]" aria-hidden="true" />
          {intel.held} {intel.held === 1 ? "review is" : "reviews are"} held for moderation because the text contained
          instructions aimed at automated systems. Held reviews are excluded from the rating, the themes and the
          shopping advisor.
        </p>
      )}
    </section>
  );
}

export function ReviewsSkeleton() {
  return <div aria-hidden="true" className="mt-24 h-72 animate-pulse rounded-3xl bg-lavender-100/60" />;
}

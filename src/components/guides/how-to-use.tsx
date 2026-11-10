import Link from "next/link";
import { ArrowRight, Check, Droplets, Info } from "lucide-react";
import type { Product } from "@/lib/catalog/types";
import { careSteps, guideFor, GUIDE_DISCLAIMER } from "@/lib/guides";

export function HowToUse({ product }: { product: Product }) {
  const guide = guideFor(product);
  if (!guide) return null;
  const care = careSteps(product);

  return (
    <section id="how-to-use" aria-labelledby="how-to-use-title" className="mt-24 scroll-mt-28">
      <p className="text-[11px] tracking-[0.2em] text-ink-muted">NEW TO THIS?</p>
      <h2 id="how-to-use-title" className="mt-2 font-display text-3xl tracking-tight text-plum-800 md:text-4xl">
        How to use {product.title}
      </h2>

      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-3xl bg-lavender-50 p-7 md:p-9">
          <p className="text-[11px] tracking-[0.18em] text-ink-muted">WHAT IT IS</p>
          <p className="mt-3 font-display text-xl leading-snug text-ink md:text-2xl">{guide.summary}</p>

          <p className="mt-8 text-[11px] tracking-[0.18em] text-ink-muted">GOOD FOR</p>
          <ul className="mt-3 space-y-2">
            {guide.goodFor.map((g) => (
              <li key={g} className="flex items-start gap-2.5 text-[15px] text-ink">
                <Check size={17} className="mt-0.5 shrink-0 text-plum-700" aria-hidden="true" /> {g}
              </li>
            ))}
          </ul>

          <Link
            href={`/guides/${guide.slug}`}
            className="mt-8 inline-flex items-center gap-2 text-[14px] font-medium text-plum-800 underline-offset-4 hover:underline"
          >
            Read the full guide to {guide.name.toLowerCase()} <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>

        <div className="rounded-3xl border border-lavender-100 bg-white p-7 md:p-9">
          <p className="text-[11px] tracking-[0.18em] text-ink-muted">GETTING STARTED</p>
          <ol className="mt-4 space-y-4">
            {guide.steps.map((s, i) => (
              <li key={s} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-plum-800 text-[13px] font-medium text-ivory">
                  {i + 1}
                </span>
                <p className="pt-0.5 text-[15px] leading-relaxed text-ink">{s}</p>
              </li>
            ))}
          </ol>

          {care.length > 0 && (
            <>
              <p className="mt-9 flex items-center gap-2 text-[11px] tracking-[0.18em] text-ink-muted">
                <Droplets size={14} aria-hidden="true" /> CARE & STORAGE
              </p>
              <ul className="mt-3 space-y-2">
                {care.map((c) => (
                  <li key={c} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-ink-muted">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-mauve-400" aria-hidden="true" /> {c}
                  </li>
                ))}
              </ul>
            </>
          )}

          <p className="mt-8 flex items-start gap-2 border-t border-lavender-100 pt-5 text-[12px] leading-relaxed text-ink-muted">
            <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" /> {GUIDE_DISCLAIMER}
          </p>
        </div>
      </div>
    </section>
  );
}

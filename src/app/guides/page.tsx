import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Droplets, Gauge, Sparkles } from "lucide-react";
import { GROUP_LABELS, GUIDES, GUIDE_DISCLAIMER, type GuideGroup } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Guides · Afterglow",
  description: "Plain-language guides to what each product is, who it suits and how to use it.",
};

const BASICS = [
  {
    icon: Gauge,
    title: "Start low, go slow",
    body: "Begin on the lowest setting and build up. Everyone is different, and there's no right speed.",
  },
  {
    icon: Droplets,
    title: "Use lubricant",
    body: "It makes almost everything more comfortable. Water-based is the safe choice with every toy.",
  },
  {
    icon: Sparkles,
    title: "Clean before and after",
    body: "A quick wash with toy cleaner or mild soap, then let it dry fully before you put it away.",
  },
];

const GROUPS: GuideGroup[] = ["solo", "together", "care"];

export default function GuidesPage() {
  return (
    <main className="mx-auto max-w-7xl px-5 pb-16 pt-10 md:px-12 md:pt-16">
      <header className="max-w-3xl">
        <p className="text-[11px] tracking-[0.2em] text-ink-muted">GUIDES</p>
        <h1 className="mt-3 font-display text-5xl tracking-tight text-plum-800 md:text-6xl">
          New here? <em className="font-normal italic text-plum-700">Start here.</em>
        </h1>
        <p className="mt-5 text-[17px] leading-relaxed text-ink-muted">
          Short, plain-language guides to what each kind of product is, who it suits and how to use it. No jargon,
          no judgement, and written for every body and every kind of relationship.
        </p>
      </header>

      <section aria-labelledby="basics" className="mt-14">
        <h2 id="basics" className="sr-only">The basics</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {BASICS.map((b) => (
            <div key={b.title} className="rounded-3xl bg-lavender-50 p-7">
              <b.icon size={22} className="text-plum-700" aria-hidden="true" />
              <p className="mt-4 font-display text-xl text-ink">{b.title}</p>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      {GROUPS.map((group) => (
        <section key={group} aria-labelledby={`g-${group}`} className="mt-20">
          <h2 id={`g-${group}`} className="font-display text-3xl tracking-tight text-plum-800 md:text-4xl">
            {GROUP_LABELS[group].title}
          </h2>
          <p className="mt-2 text-[15px] text-ink-muted">{GROUP_LABELS[group].blurb}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GUIDES.filter((g) => g.group === group).map((g) => (
              <Link
                key={g.slug}
                href={`/guides/${g.slug}`}
                className="group flex flex-col rounded-3xl border border-lavender-100 bg-white p-6 transition hover:-translate-y-0.5 hover:border-mauve-400/60 hover:shadow-[0_12px_30px_-18px_rgba(46,15,41,0.35)]"
              >
                <p className="font-display text-xl text-ink group-hover:text-plum-700">{g.name}</p>
                <p className="mt-2 line-clamp-3 flex-1 text-[14px] leading-relaxed text-ink-muted">{g.summary}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-plum-800">
                  Read guide <ArrowRight size={14} className="transition group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <p className="mt-20 max-w-3xl text-[12px] leading-relaxed text-ink-muted">{GUIDE_DISCLAIMER}</p>
    </main>
  );
}

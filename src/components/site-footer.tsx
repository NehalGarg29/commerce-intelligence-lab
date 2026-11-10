import Link from "next/link";
import { Lock, Package, ShieldCheck, Sparkles } from "lucide-react";
import { AskAdvisorButton } from "./advisor/ask-advisor-button";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "Shop all", href: "/shop" },
      { label: "For her", href: "/shop?audience=for-her" },
      { label: "For him", href: "/shop?audience=for-him" },
      { label: "Couples", href: "/shop?audience=for-couples" },
      { label: "LGBTQ+", href: "/shop?audience=for-lgbtq" },
      { label: "Care", href: "/shop?category=care" },
    ],
  },
  {
    title: "Discover",
    links: [
      { label: "Guides", href: "/guides" },
      { label: "Best reviewed", href: "/shop?sort=rating" },
      { label: "New to this", href: "/shop?tag=beginner-friendly" },
      { label: "Gift box", href: "/products/only-for-you-gift-box" },
      { label: "Compare", href: "/compare" },
    ],
  },
  {
    title: "Intelligence",
    links: [
      { label: "Retail partners", href: "/retail" },
      { label: "Agent API", href: "/agents" },
      { label: "Insights", href: "/insights" },
      { label: "ERP sync", href: "/erp" },
    ],
  },
];

const PROMISES = [
  { icon: Package, label: "Plain, unbranded packaging" },
  { icon: Lock, label: "Secure Shopify checkout" },
  { icon: ShieldCheck, label: "Body-safe materials" },
];

export function SiteFooter() {
  return (
    <footer className="mt-28 overflow-hidden bg-lavender-50 text-ink">
      {/* Promise strip */}
      <div className="border-b border-plum-800/10">
        <ul className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 py-5 text-[13px] text-ink-muted md:justify-between md:px-12">
          {PROMISES.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2">
              <Icon size={16} strokeWidth={1.6} className="text-plum-700" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 px-6 pb-10 pt-16 md:grid-cols-[1.6fr_repeat(3,1fr)] md:px-12">
        <div className="max-w-sm">
          <p className="font-display text-3xl tracking-tight text-plum-800">Lumen Atelier</p>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
            Intimate wellness, thoughtfully designed. Ask our advisor anything, privately.
          </p>
          <AskAdvisorButton className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-plum-700 px-5 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-plum-800">
            <Sparkles size={15} aria-hidden="true" /> Ask the advisor
          </AskAdvisorButton>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="text-[11px] tracking-[0.18em] text-ink-muted">{col.title.toUpperCase()}</p>
            <ul className="mt-4 space-y-3 text-[14px]">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-ink transition hover:text-plum-700">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* Oversized wordmark as a quiet sign-off */}
      <p
        aria-hidden="true"
        className="pointer-events-none select-none whitespace-nowrap px-6 text-center font-display text-[clamp(3.5rem,13vw,11rem)] leading-[0.85] tracking-tight text-plum-800/[0.07] md:px-12"
      >
        Lumen Atelier
      </p>

      <div className="border-t border-plum-800/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-6 text-[12px] text-ink-muted md:flex-row md:items-center md:justify-between md:px-12">
          <p>© 2026 Lumen Atelier · An independent concept prototype</p>
          <p>Fictional products, prices and reviews · Not affiliated with any real brand</p>
        </div>
      </div>
    </footer>
  );
}

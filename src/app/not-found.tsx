import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-5 py-24 text-center">
      <p className="text-[11px] tracking-[0.2em] text-ink-muted">PAGE NOT FOUND</p>
      <h1 className="mt-3 font-display text-5xl tracking-tight text-plum-800">We couldn&apos;t find that</h1>
      <p className="mt-4 max-w-md text-[16px] leading-relaxed text-ink-muted">
        The page or product may have moved, sold out of the catalog, or not be published to this storefront yet.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="inline-flex h-12 items-center rounded-full bg-plum-700 px-7 font-medium text-white">
          Browse the collection
        </Link>
        <Link href="/advisor" className="inline-flex h-12 items-center gap-2 rounded-full border border-plum-700 px-7 font-medium text-plum-700">
          <Sparkles size={16} aria-hidden="true" /> Ask the advisor
        </Link>
      </div>
    </main>
  );
}

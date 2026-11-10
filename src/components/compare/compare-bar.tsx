"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, X } from "lucide-react";
import { MAX_COMPARE, compareHref, useCompare } from "@/lib/compare-store";

export function CompareBar() {
  const { items, remove, clear } = useCompare();
  const pathname = usePathname();
  if (items.length === 0 || pathname === "/compare") return null;

  return (
    <div
      role="region"
      aria-label="Products selected to compare"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-2xl border border-lavender-100 bg-white/95 p-3 shadow-2xl shadow-plum-900/15 backdrop-blur-md sm:inset-x-6 sm:bottom-6"
    >
      <div className="flex items-center gap-3">
        <ul className="flex flex-1 gap-2 overflow-x-auto">
          {items.map((i) => (
            <li key={i.handle} className="flex shrink-0 items-center gap-2 rounded-xl bg-ivory py-1.5 pl-1.5 pr-2">
              <span className="relative h-9 w-9 overflow-hidden rounded-lg bg-lavender-50">
                {i.imageUrl && <Image src={i.imageUrl} alt="" fill sizes="36px" className="object-cover" />}
              </span>
              <span className="hidden max-w-28 truncate text-sm text-ink sm:inline">{i.title}</span>
              <button type="button" onClick={() => remove(i.handle)} aria-label={`Remove ${i.title}`} className="rounded-full p-1 text-ink-muted hover:bg-lavender-50 hover:text-plum-700">
                <X size={14} />
              </button>
            </li>
          ))}
          {Array.from({ length: MAX_COMPARE - items.length }, (_, k) => (
            <li key={k} aria-hidden="true" className="hidden h-12 w-28 shrink-0 rounded-xl border border-dashed border-lavender-100 sm:block" />
          ))}
        </ul>
        <button type="button" onClick={clear} className="hidden text-sm text-ink-muted hover:text-plum-700 sm:inline">
          Clear
        </button>
        {items.length >= 2 ? (
          <Link
            href={compareHref(items.map((i) => i.handle))}
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-plum-700 px-5 text-sm font-medium text-white transition hover:bg-plum-800"
          >
            Compare {items.length} <ArrowRight size={15} aria-hidden="true" />
          </Link>
        ) : (
          <span className="shrink-0 px-2 text-sm text-ink-muted">Add 1 more</span>
        )}
      </div>
    </div>
  );
}

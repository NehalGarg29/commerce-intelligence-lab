import Link from "next/link";
import { Check } from "lucide-react";
import type { Product } from "@/lib/catalog/types";
import { FEATURE_LABELS, slugify } from "@/lib/catalog/attributes";
import {
  AUDIENCES,
  BRANDS,
  BUDGETS,
  FILTER_FEATURES,
  applyFilters,
  shopHref,
  type ShopFilters,
} from "@/lib/catalog/filters";

type Option = { label: string; active: boolean; href: string; count: number };

function OptionLink({ o }: { o: Option }) {
  const disabled = o.count === 0 && !o.active;
  const body = (
    <>
      <span
        aria-hidden="true"
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition ${
          o.active ? "border-plum-700 bg-plum-700 text-white" : "border-mauve-400/70 bg-white"
        }`}
      >
        {o.active && <Check size={12} strokeWidth={3} />}
      </span>
      <span className="flex-1">{o.label}</span>
      <span className="text-xs text-ink-muted">{o.count}</span>
    </>
  );

  if (disabled) {
    return (
      <span className="flex items-center gap-3 py-1.5 text-[15px] text-ink-muted/50" aria-disabled="true">
        {body}
      </span>
    );
  }
  return (
    <Link
      href={o.href}
      scroll={false}
      aria-current={o.active ? "true" : undefined}
      className="flex items-center gap-3 rounded-md py-1.5 text-[15px] text-ink transition hover:text-plum-700"
    >
      {body}
    </Link>
  );
}

function Group({ title, options }: { title: string; options: Option[] }) {
  return (
    <fieldset className="border-t border-lavender-100 pt-5">
      <legend className="mb-2 text-[11px] tracking-[0.18em] text-ink-muted">{title.toUpperCase()}</legend>
      <div className="flex flex-col">
        {options.map((o) => (
          <OptionLink key={o.label} o={o} />
        ))}
      </div>
    </fieldset>
  );
}

export function FilterSidebar({ products, filters }: { products: Product[]; filters: ShopFilters }) {
  // Each count answers "how many results would I get if I picked this?"
  const count = (patch: Partial<ShopFilters>) => applyFilters(products, { ...filters, ...patch }).length;

  const audience: Option[] = Object.entries(AUDIENCES).map(([value, label]) => {
    const active = filters.audience === value;
    const patch = { audience: active ? null : value, category: null };
    return { label, active, href: shopHref(filters, patch), count: count({ audience: value, category: null }) };
  });
  const careActive = filters.category === "care";
  audience.push({
    label: "Care",
    active: careActive,
    href: shopHref(filters, { category: careActive ? null : "care", audience: null }),
    count: count({ category: "care", audience: null }),
  });

  const brands: Option[] = BRANDS.map((name) => {
    const slug = slugify(name);
    const active = filters.brand === slug;
    return {
      label: name,
      active,
      href: shopHref(filters, { brand: active ? null : slug }),
      count: count({ brand: slug }),
    };
  });

  const budgets: Option[] = BUDGETS.map((max) => {
    const active = filters.maxPrice === max;
    return {
      label: `Under $${max}`,
      active,
      href: shopHref(filters, { maxPrice: active ? null : max }),
      count: count({ maxPrice: max }),
    };
  });

  const features: Option[] = FILTER_FEATURES.map((tag) => {
    const active = filters.tags.includes(tag);
    const tags = active ? filters.tags.filter((t) => t !== tag) : [...filters.tags, tag];
    return {
      label: FEATURE_LABELS[tag],
      active,
      href: shopHref(filters, { tags }),
      count: count({ tags: active ? filters.tags : [...filters.tags, tag] }),
    };
  });

  const stock: Option[] = [
    {
      label: "In stock only",
      active: filters.inStock,
      href: shopHref(filters, { inStock: !filters.inStock }),
      count: count({ inStock: true }),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Group title="Shop for" options={audience} />
      <Group title="Features" options={features} />
      <Group title="Budget" options={budgets} />
      <Group title="Brand" options={brands} />
      <Group title="Availability" options={stock} />
    </div>
  );
}

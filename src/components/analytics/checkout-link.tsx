"use client";

import { track } from "@/lib/analytics/track";

// Shopify-hosted checkout is on another domain, so the click is the last
// moment the storefront can count "started checkout".
export function CheckoutLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <a href={href} className={className} onClick={() => track("checkout_start")}>
      {children}
    </a>
  );
}

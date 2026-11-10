"use client";

import { openAdvisor } from "@/lib/advisor/open";

// A button that opens the chat widget instead of navigating away.
export function AskAdvisorButton({
  prompt,
  className,
  children,
}: {
  prompt?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={() => openAdvisor(prompt)} className={className}>
      {children}
    </button>
  );
}

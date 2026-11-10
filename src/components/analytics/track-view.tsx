"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/track";

// Records one anonymous product view when a product page mounts.
export function TrackProductView({ handle }: { handle: string }) {
  useEffect(() => {
    track("product_view", { productHandle: handle });
  }, [handle]);
  return null;
}

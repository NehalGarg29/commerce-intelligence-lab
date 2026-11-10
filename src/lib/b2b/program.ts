// Wholesale partner program rules, in one place so the portal UI, the server
// and the Shopify draft order all use the same numbers.
// (Demo values; a real brand would set these with its sales team.)

export const FREE_FREIGHT_MIN = 500; // wholesale subtotal for free freight
export const FREIGHT_FLAT = 35;

export type VolumeTier = { name: string; min: number; extraPct: number };

// Extra discount on the whole order (after kit savings) once it passes a threshold.
export const VOLUME_TIERS: VolumeTier[] = [
  { name: "Silver", min: 1000, extraPct: 3 },
  { name: "Gold", min: 2500, extraPct: 6 },
];

export function currentTier(subtotal: number): VolumeTier | null {
  return [...VOLUME_TIERS].reverse().find((t) => subtotal >= t.min) ?? null;
}

export function nextTier(subtotal: number): (VolumeTier & { remaining: number }) | null {
  const t = VOLUME_TIERS.find((x) => subtotal < x.min);
  return t ? { ...t, remaining: Math.round((t.min - subtotal) * 100) / 100 } : null;
}

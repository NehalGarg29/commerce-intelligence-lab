"use client";

import { useSyncExternalStore } from "react";

// Compare selections live in the visitor's browser (localStorage), never on
// our server. The /compare page itself is driven by the URL, so a comparison
// can be shared or linked to by the AI advisor.

export type CompareItem = { handle: string; title: string; imageUrl: string | null };

export const MAX_COMPARE = 3;
const KEY = "lumen:compare:v1";
const EVENT = "lumen:compare-change";
const EMPTY: CompareItem[] = [];

let cachedRaw: string | null = null;
let cachedItems: CompareItem[] = EMPTY;

function read(): CompareItem[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === cachedRaw) return cachedItems;
    cachedRaw = raw;
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedItems = Array.isArray(parsed)
      ? parsed
          .filter((i): i is CompareItem => typeof i?.handle === "string" && typeof i?.title === "string")
          .slice(0, MAX_COMPARE)
      : EMPTY;
  } catch {
    cachedItems = EMPTY;
  }
  return cachedItems;
}

function write(items: CompareItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Storage can be unavailable (private mode); compare simply won't persist.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

export function useCompare() {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    items,
    has: (handle: string) => items.some((i) => i.handle === handle),
    isFull: items.length >= MAX_COMPARE,
    toggle: (item: CompareItem) => {
      const current = read();
      if (current.some((i) => i.handle === item.handle)) write(current.filter((i) => i.handle !== item.handle));
      else if (current.length < MAX_COMPARE) write([...current, item]);
    },
    remove: (handle: string) => write(read().filter((i) => i.handle !== handle)),
    clear: () => write([]),
  };
}

export function compareHref(handles: string[]): string {
  return `/compare?items=${handles.map(encodeURIComponent).join(",")}`;
}

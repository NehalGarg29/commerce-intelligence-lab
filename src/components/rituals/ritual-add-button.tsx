"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { Check, ShoppingBag } from "lucide-react";
import { addRitualAction, type AddToBagState } from "@/app/actions/cart";
import { formatPrice } from "@/lib/format";
import { track } from "@/lib/analytics/track";

const initial: AddToBagState = { status: "idle", message: "" };

export function RitualAddButton({ ritualId, total, disabled }: { ritualId: string; total: number; disabled: boolean }) {
  const [state, action, pending] = useActionState(addRitualAction, initial);
  useEffect(() => {
    if (state.status === "added") track("add_to_cart", { source: "ritual" });
  }, [state]);
  return (
    <div>
      <form action={action}>
        <input type="hidden" name="ritualId" value={ritualId} />
        <button
          type="submit"
          disabled={disabled || pending}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-plum-700 px-6 text-[15px] font-medium text-white transition hover:bg-plum-800 disabled:cursor-not-allowed disabled:bg-mauve-400"
        >
          <ShoppingBag size={17} aria-hidden="true" />
          {disabled ? "Currently unavailable as a set" : pending ? "Adding…" : `Add the ritual · ${formatPrice(total)}`}
        </button>
      </form>
      <div aria-live="polite" className="mt-2 min-h-5 text-center text-[13px]">
        {state.status === "added" && (
          <p className="flex items-center justify-center gap-1.5 text-[#2F6B45]">
            <Check size={14} aria-hidden="true" /> {state.message}{" "}
            <Link href="/cart" className="font-medium text-plum-700 underline underline-offset-4">View bag</Link>
          </p>
        )}
        {state.status === "error" && <p className="text-[#9A2A2A]">{state.message}</p>}
      </div>
    </div>
  );
}

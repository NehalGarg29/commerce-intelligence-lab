import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { signOutAction } from "@/app/actions/auth";

// Header account control. Shoppers see a quiet "Sign in" for partners and staff;
// signed-in users see who they are, a shortcut to their area, and sign out.
export async function AccountMenu() {
  const s = await getSession();
  if (!s) {
    return (
      <Link href="/signin" aria-label="Partner and staff sign in" title="Partner and staff sign in" className="rounded-full p-3 transition hover:bg-lavender-50">
        <User size={20} strokeWidth={1.6} />
      </Link>
    );
  }
  const home = s.role === "merchant" ? "/insights" : `/retail/${s.locationId}`;
  return (
    <div className="flex items-center gap-1">
      <Link
        href={home}
        className="hidden max-w-[12rem] truncate rounded-full bg-lavender-50 px-3 py-1.5 text-[12px] text-plum-800 transition hover:bg-lavender-100 sm:inline-block"
        title={s.name}
      >
        {s.role === "merchant" ? "Merchant team" : s.company}
      </Link>
      <form action={signOutAction}>
        <button type="submit" aria-label="Sign out" title="Sign out" className="rounded-full p-3 transition hover:bg-lavender-50">
          <LogOut size={18} strokeWidth={1.6} />
        </button>
      </form>
    </div>
  );
}

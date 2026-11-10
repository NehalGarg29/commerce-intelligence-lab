import { NextResponse, type NextRequest } from "next/server";
import { decodeSession, SESSION_COOKIE } from "@/lib/auth/token";

// Optimistic check only: "is there a valid, unexpired session?" Pages and
// route handlers still check the role and which retailer the user belongs to.
export function proxy(request: NextRequest) {
  const session = decodeSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (session) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const url = new URL("/signin", request.url);
  url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/insights/:path*", "/erp/:path*", "/retail/:path*", "/api/retail/:path*", "/api/erp/:path*"],
};

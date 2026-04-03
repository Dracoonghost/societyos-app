import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/", "/login", "/founder", "/pricing", "/methodology", "/demo", "/share"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // Allow Next.js internals and static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for auth session cookie (set by the client after login)
  const authSession = request.cookies.get("auth-session");
  if (!authSession?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // First-run detection: new users hitting /dashboard get redirected to review intake
  if (pathname === "/dashboard") {
    const hasVisited = request.cookies.get("societyos_visited");
    if (!hasVisited?.value) {
      const reviewUrl = new URL("/reviews/new?mode=review", request.url);
      const response = NextResponse.redirect(reviewUrl);
      response.cookies.set("societyos_visited", "1", {
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: "lax",
      });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

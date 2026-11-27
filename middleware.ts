import { NextResponse, type NextRequest } from "next/server";

import { verifySessionToken } from "@/lib/auth/jwt";
import { defaultRouteForRole } from "@/lib/auth/rbac";
import { SESSION_COOKIE } from "@/lib/constants";

const AUTH_PAGES = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (isAuthPage) {
    if (session) {
      return NextResponse.redirect(
        new URL(defaultRouteForRole(session.role), request.url),
      );
    }
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/dashboard") && session.role === "customer") {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  if (pathname.startsWith("/portal") && session.role !== "customer") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/portal/:path*", "/login", "/register"],
};

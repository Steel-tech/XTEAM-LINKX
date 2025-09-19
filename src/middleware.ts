import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  // Always allow access to public routes
  if (pathname.startsWith("/api/auth") || pathname === "/" || pathname === "/unauthorized") {
    return NextResponse.next();
  }

  // Require authentication for all other routes
  if (!user) {
    return NextResponse.redirect(new URL("/api/auth/signin", req.url));
  }

  // Check if user is trying to access admin routes
  if (pathname.startsWith("/admin")) {
    // Check if user has admin or PM role
    if (!user.role || !["ADMIN", "PM"].includes(user.role)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/login"];

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get("sessionToken")?.value;
  const { pathname } = request.nextUrl;

  // Allow all requests to public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow API routes for auth
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // If protected route and no session, redirect to login
  if (!sessionToken && !publicRoutes.includes(pathname)) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};

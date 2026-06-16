import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const ACCESS_COOKIE = "access_token";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET as string);

// In-memory rate limiting (works per edge-instance, so not perfect but good enough for simple requirements without Redis)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Rate Limiting for API routes
  if (pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const now = Date.now();
    const rateLimitData = rateLimitMap.get(ip) || { count: 0, lastReset: now };

    if (now - rateLimitData.lastReset > RATE_LIMIT_WINDOW_MS) {
      rateLimitData.count = 1;
      rateLimitData.lastReset = now;
    } else {
      rateLimitData.count += 1;
      if (rateLimitData.count > MAX_REQUESTS_PER_WINDOW) {
        return new NextResponse("Too Many Requests", { status: 429 });
      }
    }
    rateLimitMap.set(ip, rateLimitData);
  }

  // 2. CSRF Protection for API Mutations
  const method = request.method;
  if (pathname.startsWith("/api/") && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    
    if (origin) {
      const originUrl = new URL(origin);
      // We check if the request origin matches our own host to prevent cross-site request forgery
      if (originUrl.host !== host) {
        return new NextResponse("CSRF Check Failed", { status: 403 });
      }
    }
  }

  // 3. Route Protection
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isDashboard = pathname.startsWith("/dashboard");

  let isValidSession = false;

  if (access) {
    try {
      await jwtVerify(access, JWT_SECRET);
      isValidSession = true;
    } catch (error) {
      // Token is invalid or expired
      isValidSession = false;
    }
  }

  if (!isValidSession && isDashboard) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isValidSession && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup", "/api/:path*"],
};

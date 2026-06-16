import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshSession, authCookieNames, setSessionCookies, clearSessionCookies } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(authCookieNames.refresh)?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    const deviceInfo = request.headers.get("user-agent") || undefined;
    const ipAddress = request.headers.get("x-forwarded-for") || undefined;

    const refreshed = await refreshSession(refreshToken, deviceInfo, ipAddress);
    if (!refreshed) {
      await clearSessionCookies();
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    }

    await setSessionCookies(
      refreshed.accessToken,
      refreshed.refreshToken,
      refreshed.accessTokenExpiresAt,
      refreshed.refreshTokenExpiresAt,
    );

    return NextResponse.json({ success: true, user: refreshed.user });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

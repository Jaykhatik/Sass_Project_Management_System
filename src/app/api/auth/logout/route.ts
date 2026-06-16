import { NextResponse } from "next/server";
import { logoutFromCurrentDevice, logoutFromAllDevices, authCookieNames } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(authCookieNames.refresh)?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "You are already logged out", code: "NOT_LOGGED_IN" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    if (body.allDevices) {
      await logoutFromAllDevices();
    } else {
      await logoutFromCurrentDevice();
    }

    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getSessionUserWithRefresh } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUserWithRefresh();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}

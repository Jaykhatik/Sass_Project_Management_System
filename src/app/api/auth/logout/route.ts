import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authCookieNames } from "@/lib/auth";

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const accessToken = cookieHeader.match(new RegExp(`${authCookieNames.access}=([^;]+)`))?.[1];
  const refreshToken = cookieHeader.match(new RegExp(`${authCookieNames.refresh}=([^;]+)`))?.[1];

  if (accessToken) {
    await prisma.$executeRaw`DELETE FROM "Session" WHERE "accessToken" = ${accessToken}`.catch(() => {});
  }

  if (refreshToken) {
    await prisma.$executeRaw`DELETE FROM "Session" WHERE "refreshToken" = ${refreshToken}`.catch(() => {});
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(authCookieNames.access, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    path: "/",
  });
  response.cookies.set(authCookieNames.refresh, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    path: "/",
  });

  return response;
}

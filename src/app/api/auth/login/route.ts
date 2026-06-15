import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createSession, setSessionCookies, verifyPassword } from "@/lib/auth";
import { BadRequestError, AppError } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      throw new BadRequestError("Email and password are required");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      throw new BadRequestError("Invalid email or password");
    }

    const valid = verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new BadRequestError("Invalid email or password");
    }

    const session = await createSession(user.id);
    await setSessionCookies(
      session.accessToken,
      session.refreshToken,
      session.accessTokenExpiresAt,
      session.refreshTokenExpiresAt,
    );

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

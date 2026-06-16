import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, createSession, setSessionCookies } from "@/lib/auth";
import { BadRequestError, AppError } from "@/lib/errors";


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (name.length < 2) {
      throw new BadRequestError("Name must be at least 2 characters");
    }
    if (!email.includes("@")) {
      throw new BadRequestError("Enter a valid email address");
    }
    if (password.length < 8) {
      throw new BadRequestError("Password must be at least 8 characters");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestError("An account already exists for this email");
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        emailVerified: false,
      },
    });

    return NextResponse.json(
      {
        message: "Registration successful. Please login to verify your email and create your workspace.",
        redirectTo: `/login?email=${encodeURIComponent(user.email)}`,
        authenticated: false,
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email,
          avatarUrl: user.avatarUrl,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt
        },
      },
      { status: 201 },
    );
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

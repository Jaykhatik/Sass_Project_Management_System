import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, createSession, setSessionCookies } from "@/lib/auth";
import { BadRequestError, AppError } from "@/lib/errors";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

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

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashPassword(password),
        emailVerified: true,
      },
    });

    const baseSlug = slugify(name) || "workspace";
    const slug = `${baseSlug}-${user.id.slice(0, 6)}`;

    const workspace = await prisma.workspace.create({
      data: {
        name: `${name}'s Workspace`,
        slug,
        ownerId: user.id,
        members: {
          create: [{ userId: user.id, role: "owner" }],
        },
      },
    });

    const session = await createSession(user.id);
    await setSessionCookies(
      session.accessToken,
      session.refreshToken,
      session.accessTokenExpiresAt,
      session.refreshTokenExpiresAt,
    );

    return NextResponse.json(
      {
        user: { id: user.id, name: user.name, email: user.email },
        workspace: { id: workspace.id, slug: workspace.slug },
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

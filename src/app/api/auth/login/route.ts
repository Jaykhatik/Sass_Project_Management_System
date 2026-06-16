import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createSession, setSessionCookies, verifyPassword, getPrimaryWorkspaceForUser } from "@/lib/auth";
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
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      throw new BadRequestError("Email and password are required");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      throw new BadRequestError("Invalid email or password");
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new BadRequestError("Invalid email or password");
    }

    let isFirstLogin = false;
    let workspace = null;

    if (!user.emailVerified) {
      isFirstLogin = true;
      
      // Update user verification
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
      user.emailVerified = true;

      // Create initial workspace
      const baseSlug = slugify(user.name || "workspace");
      const slug = `${baseSlug}-${user.id.slice(0, 6)}`;

      workspace = await prisma.workspace.create({
        data: {
          name: `${user.name || 'User'}'s Workspace`,
          slug,
          ownerId: user.id,
          members: {
            create: [{ userId: user.id, role: "owner" }],
          },
        },
      });
    } else {
      workspace = await getPrimaryWorkspaceForUser(user.id);
    }

    const deviceInfo = request.headers.get("user-agent") || undefined;
    const ipAddress = request.headers.get("x-forwarded-for") || undefined;
    const session = await createSession(user.id, user.email, deviceInfo, ipAddress);
    await setSessionCookies(
      session.accessToken,
      session.refreshToken,
      session.accessTokenExpiresAt,
      session.refreshTokenExpiresAt,
    );

    const responsePayload: any = {
      message: isFirstLogin 
        ? "Login successful. Email verified and initial workspace created." 
        : "Login successful.",
      authenticated: true,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt
      },
    };

    if (workspace) {
      responsePayload.workspace = {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
      };
    }

    return NextResponse.json(responsePayload);
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

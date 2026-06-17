import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const invite = await prisma.invitation.findUnique({
      where: { token },
      include: { 
        workspace: { select: { name: true, logoUrl: true } },
        inviter: { select: { name: true, email: true } }
      }
    });

    if (!invite) {
      return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 404 });
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invitation has expired" }, { status: 400 });
    }

    return NextResponse.json(invite);
  } catch (error) {
    console.error("Failed to fetch invite details:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

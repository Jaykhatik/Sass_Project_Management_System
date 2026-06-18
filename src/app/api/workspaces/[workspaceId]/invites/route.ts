import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import crypto from "crypto";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId } = await params;
    const body = await request.json();
    const { email, role } = body;

    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    // Verify admin/owner status
    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });

    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });

    if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    if (!membership && workspace.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (membership && membership.role !== "owner") {
      return NextResponse.json({ error: "Only the workspace owner can invite members" }, { status: 403 });
    }


    // Plan Limit Check
    const subscription = await prisma.subscription.findUnique({
      where: { workspaceId }
    });

    if (!subscription || subscription.plan === "free" || subscription.status !== "active") {
      const memberCount = await prisma.workspaceMember.count({
        where: { workspaceId }
      });
      const activeInvitesCount = await prisma.invitation.count({
        where: { workspaceId, acceptedAt: null }
      });

      if (memberCount + activeInvitesCount >= 5) {
        return NextResponse.json(
          {
            error: "You have reached the free tier limit of 5 team members. Please upgrade to Pro to invite more.",
            code: "PLAN_LIMIT_REACHED",
          },
          { status: 403 }
        );
      }
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const invite = await prisma.invitation.create({
      data: {
        workspaceId,
        email: email.toLowerCase().trim(),
        role: role || "member",
        token,
        invitedBy: user.id,
        expiresAt,
      },
    });

    return NextResponse.json(invite, { status: 201 });
  } catch (error) {
    console.error("Failed to create invite:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId } = await params;

    // Verify access
    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });

    if (!workspace || (!membership && workspace.ownerId !== user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const invites = await prisma.invitation.findMany({
      where: { workspaceId, acceptedAt: null },
      orderBy: { createdAt: "desc" },
      include: { inviter: { select: { name: true, email: true } } }
    });

    return NextResponse.json(invites);
  } catch (error) {
    console.error("Failed to fetch invites:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { notifyUser } from "@/lib/notificationService";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { token } = await params;

    const invite = await prisma.invitation.findUnique({
      where: { token },
      include: { workspace: true }
    });

    if (!invite) {
      return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 404 });
    }

    if (invite.expiresAt < new Date()) {
      // Clean up expired invite
      await prisma.invitation.delete({ where: { id: invite.id } });
      return NextResponse.json({ error: "Invitation has expired" }, { status: 400 });
    }

    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json({ error: `This invitation is for ${invite.email}. Please log out and sign in with the correct account.` }, { status: 403 });
    }

    if (invite.acceptedAt) {
      return NextResponse.json({ error: "Invitation already accepted" }, { status: 400 });
    }

    // Check if user is already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId: user.id } }
    });

    if (existingMember || invite.workspace.ownerId === user.id) {
      return NextResponse.json({ error: "You are already a member of this workspace" }, { status: 400 });
    }

    // Accept invite in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Create the member
      await tx.workspaceMember.create({
        data: {
          workspaceId: invite.workspaceId,
          userId: user.id,
          role: invite.role,
          invitedBy: invite.invitedBy
        }
      });

      // 2. We can either mark as accepted or delete. Let's delete to burn the token.
      await tx.invitation.delete({ where: { id: invite.id } });
    });

    // Notify the workspace owner that a member joined
    await notifyUser({
      workspaceId: invite.workspaceId,
      userId: invite.workspace.ownerId,
      type: "member_added",
      title: `${user.name || user.email} joined the workspace`,
      data: { userId: user.id }
    });

    return NextResponse.json({ success: true, workspaceId: invite.workspaceId });
  } catch (error) {
    console.error("Failed to accept invite:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string; inviteId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, inviteId } = await params;

    // Verify access
    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });

    if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    
    if (!membership && workspace.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (membership && membership.role !== "admin" && membership.role !== "owner") {
      return NextResponse.json({ error: "Only admins can revoke invites" }, { status: 403 });
    }

    await prisma.invitation.delete({
      where: { id: inviteId, workspaceId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to revoke invite:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

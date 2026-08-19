import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getCurrentSubscription } from "@/services/billingService";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId } = await params;

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true }
    });
    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } }
    });

    const isOwner = workspace?.ownerId === user.id || membership?.role === "owner";
    if (!isOwner) {
      return NextResponse.json({ error: "Only the workspace owner can view billing details" }, { status: 403 });
    }

    const subscription = await getCurrentSubscription(workspaceId);

    return NextResponse.json(subscription);
  } catch (error: any) {
    console.error("Failed to fetch billing:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

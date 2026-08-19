import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createPortalSession } from "@/services/billingService";

import prisma from "@/lib/prisma";

export async function POST(
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
      return NextResponse.json({ error: "Only the workspace owner can manage subscriptions" }, { status: 403 });
    }

    const url = await createPortalSession(workspaceId);

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("Failed to create portal session:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

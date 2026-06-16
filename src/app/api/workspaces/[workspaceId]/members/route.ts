import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';

import { getSessionUserWithRefresh } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const user = await getSessionUserWithRefresh();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const { workspaceId } = await params;
    
    // Verify access
    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });
    const ownedWorkspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, ownerId: user.id },
    });

    if (!membership && !ownedWorkspace) {
      return NextResponse.json({ error: "You do not have access to this workspace", code: "FORBIDDEN" }, { status: 403 });
    }

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { joinedAt: "asc" },
    });

    const formattedMembers = members.map((m) => ({
      membership_id: m.id,
      workspaceId: m.workspaceId,
      role: m.role,
      joinedAt: m.joinedAt,
      invitedBy: m.invitedBy,
      user: m.user,
    }));

    return NextResponse.json(formattedMembers);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

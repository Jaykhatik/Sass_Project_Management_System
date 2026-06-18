import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
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
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ tasks: [], projects: [], members: [] });
    }

    const searchTerm = query.trim();

    // Verify access
    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });
    
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 1. Search Tasks
    const tasks = await prisma.task.findMany({
      where: {
        workspaceId,
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ]
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        project: { select: { id: true, name: true } }
      },
      take: 10,
    });

    // 2. Search Projects
    const projects = await prisma.project.findMany({
      where: {
        workspaceId,
        name: { contains: searchTerm, mode: 'insensitive' }
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
      take: 5,
    });

    // 3. Search Members
    const members = await prisma.workspaceMember.findMany({
      where: {
        workspaceId,
        user: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
          ]
        }
      },
      select: {
        id: true,
        role: true,
        user: { select: { id: true, name: true, email: true, avatarUrl: true } }
      },
      take: 5,
    });

    return NextResponse.json({
      tasks,
      projects,
      members,
    });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

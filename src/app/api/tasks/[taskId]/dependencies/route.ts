import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUserWithRefresh } from "@/lib/auth";

export async function POST(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const user = await getSessionUserWithRefresh();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { taskId } = await params;
    const { dependentTaskId } = await request.json();

    if (!dependentTaskId) {
      return NextResponse.json({ error: "dependentTaskId required" }, { status: 400 });
    }

    if (taskId === dependentTaskId) {
      return NextResponse.json({ error: "A task cannot depend on itself" }, { status: 400 });
    }

    const existing = await prisma.taskDependency.findUnique({
      where: {
        blockerTaskId_blockedTaskId: {
          blockedTaskId: taskId,
          blockerTaskId: dependentTaskId
        }
      }
    });

    if (existing) {
      return NextResponse.json({ error: "Dependency already exists" }, { status: 400 });
    }

    const dependency = await prisma.taskDependency.create({
      data: {
        blockedTaskId: taskId,
        blockerTaskId: dependentTaskId
      }
    });

    return NextResponse.json(dependency);
  } catch (error: any) {
    console.error("Dependency error:", error);
    return NextResponse.json({ error: error.message || "Failed to create dependency" }, { status: 500 });
  }
}

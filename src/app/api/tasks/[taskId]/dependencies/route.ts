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

    const dependency = await prisma.taskDependency.create({
      data: {
        blockedTaskId: taskId,
        blockerTaskId: dependentTaskId
      }
    });

    return NextResponse.json(dependency);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create dependency" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { boardId } = await params;
    const body = await request.json();
    const { workspaceId, tasks } = body as {
      workspaceId: string;
      tasks: { id: string; columnId: string; position: number }[];
    };

    if (!workspaceId || !tasks || !Array.isArray(tasks)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Run updates in a transaction for atomicity
    await prisma.$transaction(
      tasks.map((t) =>
        prisma.task.update({
          where: { id: t.id },
          data: { columnId: t.columnId, position: t.position },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering tasks:", error);
    return NextResponse.json({ error: "Failed to reorder tasks" }, { status: 500 });
  }
}

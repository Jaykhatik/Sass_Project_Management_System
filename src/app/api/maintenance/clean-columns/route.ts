import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const customCols = await prisma.column.findMany({
      where: {
        name: {
          notIn: ['To Do', 'In Progress', 'In Review', 'Done']
        }
      }
    });

    for (const col of customCols) {
      const doneCol = await prisma.column.findFirst({
        where: { boardId: col.boardId, name: 'Done' }
      });
      
      if (doneCol) {
        await prisma.task.updateMany({
          where: { columnId: col.id },
          data: { columnId: doneCol.id }
        });
      }
      
      await prisma.column.delete({
        where: { id: col.id }
      });
    }

    return NextResponse.json({ success: true, deletedCount: customCols.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

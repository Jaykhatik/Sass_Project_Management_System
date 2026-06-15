import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    include: { subscription: true },
  });

  if (!workspace) {
    return NextResponse.json(
      { error: "Workspace not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  return NextResponse.json(workspace);
}

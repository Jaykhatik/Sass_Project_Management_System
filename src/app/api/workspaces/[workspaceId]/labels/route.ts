import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUserWithRefresh } from "@/lib/auth";

export async function GET(request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const user = await getSessionUserWithRefresh();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId } = await params;
    
    const labels = await prisma.label.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" }
    });

    return NextResponse.json(labels);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch labels" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const user = await getSessionUserWithRefresh();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId } = await params;
    const { name, color } = await request.json();

    const label = await prisma.label.create({
      data: {
        workspaceId,
        name,
        color
      }
    });

    return NextResponse.json(label);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create label" }, { status: 500 });
  }
}

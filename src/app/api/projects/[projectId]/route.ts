import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AppError } from "@/lib/errors";

// GET /api/projects/[projectId]?workspaceId=xxx
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, workspaceId },
      include: {
        boards: {
          where: { isDefault: true },
          include: {
            columns: {
              orderBy: { position: "asc" },
              include: {
                tasks: {
                  orderBy: { position: "asc" },
                  include: {
                    assignees: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
                    labels: { include: { label: true } },
                  },
                },
              },
            },
          },
        },
        _count: { select: { tasks: true } },
      },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found", code: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[projectId]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const { workspaceId, name, description, color, status, startDate, dueDate } = body;

    if (!workspaceId || typeof workspaceId !== "string") {
      return NextResponse.json(
        { error: "workspaceId is required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const existing = await prisma.project.findFirst({ where: { id: projectId, workspaceId } });
    if (!existing) {
      return NextResponse.json({ error: "Project not found", code: "NOT_FOUND" }, { status: 404 });
    }
    const validStatuses = ["active", "archived", "completed"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid project status", code: "VALIDATION_ERROR" }, { status: 400 });
    }
    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
        ...(status !== undefined && { status }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
    });

    return NextResponse.json(project);
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId] — archives the project
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const existing = await prisma.project.findFirst({ where: { id: projectId, workspaceId } });
    if (!existing) {
      return NextResponse.json({ error: "Project not found", code: "NOT_FOUND" }, { status: 404 });
    }
    const project = await prisma.project.update({
      where: { id: projectId },
      data: { status: "archived" },
    });
    return NextResponse.json(project);
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

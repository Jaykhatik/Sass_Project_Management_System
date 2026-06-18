import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { logActivity } from "@/lib/activityLogger";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { taskId } = await params;

    // Verify task and get workspaceId
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { workspaceId: true }
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalFilename = file.name;
    const mimeType = file.type;
    const fileSize = file.size;

    // Generate unique filename to prevent collisions
    const fileExtension = path.extname(originalFilename);
    const safeBaseName = path.basename(originalFilename, fileExtension).replace(/[^a-zA-Z0-9]/g, "_");
    const uniqueFilename = `${safeBaseName}_${crypto.randomBytes(4).toString("hex")}${fileExtension}`;

    // Determine storage directory based on mimeType
    let subDirectory = "other";
    if (mimeType.startsWith("image/")) {
      subDirectory = "images/uploads";
    } else if (
      mimeType.includes("pdf") || 
      mimeType.includes("document") || 
      mimeType.includes("msword") ||
      mimeType.includes("excel") ||
      mimeType.includes("csv") ||
      mimeType.includes("text")
    ) {
      subDirectory = "files";
    }

    // Absolute path to the public directory
    const publicDir = path.join(process.cwd(), "public");
    const targetDir = path.join(publicDir, subDirectory);

    // Ensure the directory exists
    await fs.mkdir(targetDir, { recursive: true });

    // Save the file
    const filePath = path.join(targetDir, uniqueFilename);
    await fs.writeFile(filePath, buffer);

    // The URL path to access the file from the browser
    const fileUrl = `/${subDirectory}/${uniqueFilename}`;

    // Create attachment record in database
    const attachment = await prisma.attachment.create({
      data: {
        taskId,
        workspaceId: task.workspaceId,
        uploadedBy: user.id,
        filename: originalFilename,
        fileUrl,
        fileSize: fileSize,
        mimeType
      },
      include: {
        uploader: { select: { id: true, name: true, email: true } }
      }
    });

    // Log the upload activity
    await logActivity(
      task.workspaceId,
      user.id,
      "task",
      taskId,
      "attached a file",
      null,
      { filename: originalFilename, fileSize: Number(fileSize) }
    );

    const serializedAttachment = {
      ...attachment,
      fileSize: attachment.fileSize ? Number(attachment.fileSize) : null
    };

    return NextResponse.json(serializedAttachment, { status: 201 });
  } catch (error) {
    console.error("Failed to upload file:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { taskId } = await params;

    const attachments = await prisma.attachment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      include: {
        uploader: { select: { id: true, name: true, email: true } }
      }
    });

    const serializedAttachments = attachments.map(a => ({
      ...a,
      fileSize: a.fileSize ? Number(a.fileSize) : null
    }));

    return NextResponse.json(serializedAttachments);
  } catch (error) {
    console.error("Failed to fetch attachments:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

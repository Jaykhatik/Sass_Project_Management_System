import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ taskId: string, attachmentId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { taskId, attachmentId } = await params;

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId, taskId },
      include: { task: { select: { workspaceId: true } } }
    });

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    // RBAC: Only the uploader or the workspace owner can delete the attachment
    const workspace = await prisma.workspace.findUnique({
      where: { id: attachment.task.workspaceId }
    });

    const isOwner = workspace?.ownerId === user.id;
    const isUploader = attachment.uploadedBy === user.id;

    if (!isOwner && !isUploader) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to delete this file" }, { status: 403 });
    }

    // Delete the file from the filesystem
    try {
      const publicDir = path.join(process.cwd(), "public");
      // fileUrl looks like /images/uploads/filename.png
      // Decode URI component in case filename has spaces
      const safeFileUrl = decodeURIComponent(attachment.fileUrl);
      const filePath = path.join(publicDir, safeFileUrl);
      
      await fs.unlink(filePath);
    } catch (fsError) {
      console.warn("Failed to delete file from filesystem, it might have already been deleted manually:", fsError);
    }

    // Delete the database record
    await prisma.attachment.delete({
      where: { id: attachmentId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete attachment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

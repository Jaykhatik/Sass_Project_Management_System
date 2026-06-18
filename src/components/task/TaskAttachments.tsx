"use client";

import React, { useState, useEffect, useRef } from "react";
import { Attachment, User } from "@/types";
import { getAttachments, uploadAttachment, deleteAttachment } from "@/services/attachmentService";
import { Paperclip, File, Image as ImageIcon, X, Loader2, Download, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface TaskAttachmentsProps {
  taskId: string;
  currentUser: User | null;
}

export default function TaskAttachments({ taskId, currentUser }: TaskAttachmentsProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchAttachments = async () => {
      try {
        const data = await getAttachments(taskId);
        setAttachments(data);
      } catch (error) {
        console.error("Failed to load attachments:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAttachments();
  }, [taskId]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: globalThis.File[]) => {
    setIsUploading(true);
    for (const file of files) {
      try {
        const newAttachment = await uploadAttachment(taskId, file);
        setAttachments(prev => [...prev, newAttachment]);
      } catch (error) {
        console.error("Upload failed for", file.name, error);
        alert(`Failed to upload ${file.name}`);
      }
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    
    try {
      await deleteAttachment(taskId, attachmentId);
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
    } catch (error: any) {
      alert(error.message || "Failed to delete attachment");
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Paperclip className="w-5 h-5 text-indigo-500" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Attachments</h3>
        <span className="bg-muted px-2 py-0.5 rounded-full text-xs font-semibold">{attachments.length}</span>
      </div>

      {/* Drag & Drop Zone */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 mb-6 flex flex-col items-center justify-center transition-all cursor-pointer group",
          isDragging ? "border-indigo-500 bg-indigo-500/10" : "border-border hover:border-indigo-400 hover:bg-muted/50"
        )}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple 
          onChange={handleFileSelect}
        />
        <div className="bg-background shadow-sm border p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
          {isUploading ? <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" /> : <Paperclip className="w-6 h-6 text-muted-foreground group-hover:text-indigo-500" />}
        </div>
        <p className="text-sm font-semibold mb-1">
          {isUploading ? "Uploading files..." : "Click or drag files to attach"}
        </p>
        <p className="text-xs text-muted-foreground">
          Supports Images, PDFs, Docs, and more up to 10MB
        </p>
      </div>

      {/* Attachment Grid */}
      {isLoading ? (
        <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : attachments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {attachments.map((attachment) => {
            const isImage = attachment.mimeType?.startsWith("image/");
            // Only strictly allow delete if current user is the uploader. 
            // Owners can delete from backend, but UI will only show for uploader.
            const canDelete = currentUser?.id === attachment.uploadedBy;

            return (
              <div key={attachment.id} className="group relative flex items-center gap-3 p-3 rounded-lg border bg-card hover:border-indigo-500/50 transition-colors shadow-sm">
                
                {/* Icon/Preview */}
                <div className="w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-muted flex items-center justify-center border">
                  {isImage ? (
                    <img src={attachment.fileUrl} alt={attachment.filename} className="w-full h-full object-cover" />
                  ) : (
                    <File className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground pr-6" title={attachment.filename}>
                    {attachment.filename}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                    <span>{formatFileSize(attachment.fileSize)}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(attachment.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>

                {/* Actions (Hover) */}
                <div className="absolute right-2 top-2 bottom-2 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-card via-card pl-4">
                  <a href={attachment.fileUrl} download={attachment.filename} target="_blank" rel="noreferrer" className="p-1.5 text-muted-foreground hover:text-indigo-500 bg-background border rounded-md shadow-sm mb-1">
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  {canDelete && (
                    <button onClick={() => handleDelete(attachment.id)} className="p-1.5 text-muted-foreground hover:text-destructive bg-background border rounded-md shadow-sm">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { Comment, ActivityLog } from "@/types";
import { getComments, createComment, deleteComment, updateComment } from "@/services/commentService";
import { getTaskActivity } from "@/services/activityService";
import { Loader2, MessageSquare, Activity, Trash2, Send, Edit2, Reply } from "lucide-react";
import dynamic from "next/dynamic";

const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false }
);

import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";

function formatDistanceToNowNative(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
}

interface Props {
  taskId: string;
  workspaceId: string;
  currentUser?: any;
  members?: any[];
}

export function TaskTimeline({ taskId, workspaceId, currentUser, members }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);

  useEffect(() => {
    fetchTimeline();
  }, [taskId, workspaceId]);

  const fetchTimeline = async () => {
    try {
      const [comments, activities] = await Promise.all([
        getComments(workspaceId, taskId),
        getTaskActivity(workspaceId, taskId)
      ]);

      const combined = [
        ...comments.map(c => ({ ...c, type: "comment" })),
        ...activities.filter(a => a.action !== "commented" && a.action !== "deleted a comment").map(a => ({ ...a, type: "activity" }))
      ];

      combined.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      setItems(combined);
    } catch (error) {
      console.error("Failed to fetch timeline", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async (parentId?: string) => {
    const content = parentId ? editContent : newComment;
    if (!content.trim()) return;
    setPosting(true);
    try {
      await createComment(workspaceId, taskId, content.trim(), parentId);
      if (parentId) {
        setReplyingToId(null);
        setEditContent("");
      } else {
        setNewComment("");
      }
      toast.success("Comment posted successfully");
      await fetchTimeline();
    } catch (error) {
      toast.error("Failed to post comment");
    } finally {
      setPosting(false);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) return;
    setPosting(true);
    try {
      await updateComment(workspaceId, taskId, commentId, editContent.trim());
      setEditingId(null);
      setEditContent("");
      toast.success("Comment updated");
      await fetchTimeline();
    } catch (error: any) {
      toast.error(error.message || "Failed to update comment");
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Delete comment?")) return;
    try {
      await deleteComment(workspaceId, taskId, commentId);
      toast.success("Comment deleted");
      await fetchTimeline();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete comment");
    }
  };

  if (loading) {
    return <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  // Group threaded comments
  const timelineItems: any[] = [];
  const commentMap = new Map<string, any>();

  items.forEach(item => {
    if (item.type === "comment") {
      item.replies = [];
      commentMap.set(item.id, item);
    }
  });

  items.forEach(item => {
    if (item.type === "comment" && item.parentId) {
      const parent = commentMap.get(item.parentId);
      if (parent) {
        parent.replies.push(item);
      } else {
        timelineItems.push(item);
      }
    } else {
      timelineItems.push(item);
    }
  });

  return (
    <div className="pt-8 border-t border-border/50 space-y-6">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        <MessageSquare className="w-4 h-4" />
        <span>Activity & Comments</span>
      </div>

      <div className="space-y-4">
        {timelineItems.map((item) => {
          if (item.type === "activity") {
            const act = item as ActivityLog;
            let actionText = act.action;
            if (act.action === "updated") {
              if (act.afterData?.status !== act.beforeData?.status) {
                actionText = `changed status to ${act.afterData?.status}`;
              } else if (act.afterData?.priority !== act.beforeData?.priority) {
                actionText = `changed priority to ${act.afterData?.priority}`;
              } else if (act.afterData?.columnId !== act.beforeData?.columnId) {
                actionText = `moved task`;
              } else {
                actionText = "updated the task";
              }
            }
            return (
              <div key={act.id} className="flex gap-3 text-sm text-muted-foreground items-start px-2 py-1">
                <div className="mt-0.5"><Activity className="w-4 h-4" /></div>
                <div>
                  <span className="font-semibold text-foreground mr-1">{act.actor?.name || "System"}</span>
                  <span>{actionText}</span>
                  <span className="ml-2 text-xs opacity-60">
                    {formatDistanceToNowNative(act.createdAt)}
                  </span>
                </div>
              </div>
            );
          } else {
            const renderComment = (comment: any, isReply = false) => {
              const isAuthor = currentUser?.id === comment.authorId || currentUser?.id === comment.author?.id;
              const isOwner = members?.find(m => m.user?.id === currentUser?.id)?.role === "owner";
              const canModify = isAuthor || isOwner;

              return (
              <div key={comment.id} className={`flex gap-3 group px-2 py-1 ${isReply ? 'ml-10 mt-2 relative' : ''}`}>
                {isReply && (
                  <div className="absolute -left-6 top-4 w-4 h-4 border-l-2 border-b-2 border-border/50 rounded-bl-lg" />
                )}
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0 mt-1 text-xs">
                  {comment.author?.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className="flex-1 bg-muted/30 p-3 rounded-lg border border-border/50">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{comment.author?.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNowNative(comment.createdAt)}
                      </span>
                      {comment.isEdited && (
                        <span className="text-[10px] bg-muted px-1.5 rounded text-muted-foreground">edited</span>
                      )}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                      {!isReply && (
                        <button onClick={() => { setReplyingToId(comment.id); setEditContent(""); setEditingId(null); }} className="p-1 text-muted-foreground hover:bg-muted rounded" title="Reply">
                          <Reply className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canModify && (
                        <>
                          <button onClick={() => { setEditingId(comment.id); setEditContent(comment.content); setReplyingToId(null); }} className="p-1 text-muted-foreground hover:bg-muted rounded" title="Edit">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteComment(comment.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {editingId === comment.id ? (
                    <div className="mt-2" data-color-mode="dark">
                      <MDEditor value={editContent} onChange={(val) => setEditContent(val || "")} preview="edit" height={100} />
                      <div className="flex gap-2 justify-end mt-2">
                        <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1 text-muted-foreground hover:bg-muted rounded">Cancel</button>
                        <button onClick={() => handleUpdateComment(comment.id)} disabled={posting} className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90">Save</button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm prose prose-sm prose-invert max-w-none prose-p:leading-snug prose-pre:bg-muted/50 prose-pre:p-2">
                      <ReactMarkdown>{comment.content}</ReactMarkdown>
                    </div>
                  )}

                  {/* Reply Input */}
                  {replyingToId === comment.id && !isReply && (
                    <div className="mt-4" data-color-mode="dark">
                      <MDEditor value={editContent} onChange={(val) => setEditContent(val || "")} preview="edit" height={100} />
                      <div className="flex gap-2 justify-end mt-2">
                        <button onClick={() => setReplyingToId(null)} className="text-xs px-2 py-1 text-muted-foreground hover:bg-muted rounded">Cancel</button>
                        <button onClick={() => handlePostComment(comment.id)} disabled={posting} className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90">Post Reply</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )};

            const commentAny = item as any;
            return (
              <div key={commentAny.id}>
                {renderComment(commentAny)}
                {commentAny.replies && commentAny.replies.map((reply: any) => renderComment(reply, true))}
              </div>
            );
          }
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-border/30" data-color-mode="dark">
        <MDEditor
          value={newComment}
          onChange={(val) => setNewComment(val || "")}
          preview="edit"
          height={150}
          className="w-full bg-muted/30 border rounded-xl overflow-hidden shadow-none outline-none focus-within:ring-2 ring-primary/50 mb-3"
        />
        <div className="flex justify-end">
          <button
            disabled={posting || !newComment.trim()}
            onClick={() => handlePostComment()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Comment
          </button>
        </div>
      </div>
    </div>
  );
}

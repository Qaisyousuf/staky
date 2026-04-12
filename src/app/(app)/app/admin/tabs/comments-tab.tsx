import Image from "next/image";
import Link from "next/link";
import { Flag } from "lucide-react";
import { CommentActions } from "../admin-actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type Comment = {
  id: string;
  content: string;
  hidden: boolean;
  createdAt: Date;
  reportCount: number;
  author: { id: string; name: string | null; image: string | null };
  post: { id: string; fromTool: string; toTool: string };
};

// ─── Component ────────────────────────────────────────────────────────────────

export function CommentsTab({ comments }: { comments: Comment[] }) {
  const flagged = comments.filter((c) => c.reportCount > 0).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">{comments.length} total comments</span>
        {flagged > 0 && (
          <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
            <Flag className="h-3 w-3" /> {flagged} flagged
          </span>
        )}
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-[rgba(0,0,0,0.06)] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.04)]">
        {comments.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-400">No comments yet</div>
        ) : (
          <div className="divide-y divide-[rgba(0,0,0,0.04)]">
            {/* Header */}
            <div className="hidden lg:grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-2.5 bg-[#F7F9FC] text-[10px] font-bold text-[#9BA39C] uppercase tracking-widest">
              <span>Author</span>
              <span>Content</span>
              <span>On Post</span>
              <span>Reports</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            {comments.map((comment) => (
              <div
                key={comment.id}
                className={`px-5 py-4 hover:bg-[#FAFAF9] flex flex-col lg:grid lg:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 lg:gap-4 lg:items-center ${
                  comment.reportCount > 0 ? "bg-red-50/30" : ""
                }`}
              >
                {/* Author */}
                <div className="flex items-center gap-2 shrink-0">
                  {comment.author.image ? (
                    <Image src={comment.author.image} alt="" width={28} height={28} className="rounded-full" />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                      {comment.author.name?.[0] ?? "?"}
                    </div>
                  )}
                  <span className="text-xs text-gray-700 font-medium max-w-[70px] truncate">{comment.author.name ?? "Unknown"}</span>
                </div>

                {/* Content */}
                <div className="min-w-0">
                  <p className={`text-sm line-clamp-2 ${comment.hidden ? "text-gray-400 italic line-through" : "text-gray-700"}`}>
                    {comment.content}
                  </p>
                  <span className="text-xs text-gray-400 mt-0.5 block">
                    {new Date(comment.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>

                {/* On Post */}
                <div className="shrink-0">
                  <Link
                    href={`/feed`}
                    className="text-xs text-[#0F6E56] hover:underline"
                  >
                    {comment.post.fromTool} → {comment.post.toTool}
                  </Link>
                </div>

                {/* Reports */}
                <div className="shrink-0">
                  {comment.reportCount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
                      <Flag className="h-3 w-3" /> {comment.reportCount}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </div>

                {/* Status */}
                <div className="shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    comment.hidden ? "bg-gray-100 text-gray-500" : "bg-green-50 text-green-700"
                  }`}>
                    {comment.hidden ? "Hidden" : "Visible"}
                  </span>
                </div>

                {/* Actions */}
                <div className="shrink-0">
                  <CommentActions commentId={comment.id} hidden={comment.hidden} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

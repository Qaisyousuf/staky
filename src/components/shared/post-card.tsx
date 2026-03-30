"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ThumbsUp,
  MessageCircle,
  Bookmark,
  Share2,
  ChevronDown,
  ChevronUp,
  BadgeCheck,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SwitchBadge } from "@/components/shared/tool-icon";
import { LoginPromptButton } from "@/components/shared/login-prompt-button";
import type { Post, Comment } from "@/data/mock-data";

// ─── Sub-components ───────────────────────────────────────────────────────────

function AuthorAvatar({
  initials,
  color,
  isPartner,
}: {
  initials: string;
  color: string;
  isPartner: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center text-white text-xs font-bold shrink-0 select-none",
        isPartner ? "h-11 w-11 rounded-xl" : "h-10 w-10 rounded-full"
      )}
      style={{ backgroundColor: color }}
    >
      {initials}
    </span>
  );
}

function CommentThread({ comment, depth = 0 }: { comment: Comment; depth?: number }) {
  const [repliesOpen, setRepliesOpen] = useState(false);
  const hasReplies = (comment.replies?.length ?? 0) > 0;

  return (
    <div className={cn("flex gap-2.5", depth > 0 && "ml-8 mt-2")}>
      <span
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white select-none mt-0.5"
        style={{ backgroundColor: comment.author.color }}
      >
        {comment.author.initials}
      </span>
      <div className="flex-1 min-w-0">
        <div className="rounded-xl bg-gray-50 px-3 py-2.5">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-gray-800">{comment.author.name}</span>
            <span className="text-[10px] text-gray-400">{comment.timeAgo}</span>
          </div>
          <p className="mt-0.5 text-sm text-gray-700 leading-snug">{comment.content}</p>
        </div>

        {hasReplies && (
          <button
            onClick={() => setRepliesOpen((v) => !v)}
            className="mt-1 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {repliesOpen ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            {repliesOpen ? "Hide" : `${comment.replies!.length}`} repl
            {comment.replies!.length === 1 ? "y" : "ies"}
          </button>
        )}

        {repliesOpen &&
          comment.replies?.map((reply) => (
            <CommentThread key={reply.id} comment={reply} depth={depth + 1} />
          ))}
      </div>
    </div>
  );
}

// ─── Main PostCard ────────────────────────────────────────────────────────────

interface PostCardProps {
  post: Post;
  preview?: boolean;
}

const STORY_PREVIEW_LENGTH = 220;

export function PostCard({ post, preview = false }: PostCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const isLong = post.story.length > STORY_PREVIEW_LENGTH;
  const displayStory =
    !preview && (expanded || !isLong)
      ? post.story
      : post.story.slice(0, STORY_PREVIEW_LENGTH);

  const commentCount = post.comments.length;
  const isPartner = post.author.isPartner;

  return (
    <article
      className={cn(
        "bg-white rounded-xl border border-gray-200 overflow-hidden",
        isPartner && "border-l-[3px] border-l-[#2A5FA5]"
      )}
    >
      <div className="p-4 sm:p-5">
        {/* Author header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <AuthorAvatar
              initials={post.author.initials}
              color={post.author.color}
              isPartner={isPartner}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-semibold text-gray-900 truncate">
                  {post.author.name}
                </span>
                {post.author.verified && (
                  <BadgeCheck className="h-3.5 w-3.5 text-[#2A5FA5] shrink-0" />
                )}
                {isPartner && (
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#2A5FA5] shrink-0">
                    Migration Partner
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 truncate">
                {post.author.title} · {post.author.company}
              </p>
              <p className="text-[10px] text-gray-400">{post.timeAgo}</p>
              {isPartner && post.author.rating && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                  <span className="text-[10px] font-semibold text-gray-600">
                    {post.author.rating}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    · {post.author.projects} projects
                  </span>
                </div>
              )}
            </div>
          </div>

          <LoginPromptButton
            action="follow this author"
            className="shrink-0 rounded-full border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:border-[#0F6E56] hover:text-[#0F6E56] transition-colors"
          >
            {isPartner ? "Connect" : "Follow"}
          </LoginPromptButton>
        </div>

        {/* Switch badge — compact inline */}
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5">
          <SwitchBadge from={post.from} to={post.to} size="sm" />
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Story */}
        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
          {displayStory}
          {isLong && !expanded && !preview && "…"}
        </div>
        {isLong && !preview && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 text-xs font-semibold text-[#0F6E56] hover:underline"
          >
            {expanded ? "Show less" : "…see more"}
          </button>
        )}

        {/* Partner CTA (inline, not in action bar) */}
        {!preview && isPartner && (
          <div className="mt-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#2A5FA5] hover:bg-[#244d8a] px-4 py-1.5 text-xs font-medium text-white transition-colors"
            >
              Request help from this partner
            </Link>
          </div>
        )}
      </div>

      {/* Engagement counts */}
      {!preview && (post.likes > 0 || post.saves > 0 || commentCount > 0) && (
        <div className="flex items-center justify-between px-5 py-1.5 text-[11px] text-gray-400 border-t border-gray-100">
          <span>
            {post.likes > 0 && `${post.likes} likes`}
            {post.likes > 0 && post.recommendations > 0 && " · "}
            {post.recommendations > 0 && `${post.recommendations} recommendations`}
          </span>
          {commentCount > 0 && (
            <span>{commentCount} comment{commentCount !== 1 ? "s" : ""}</span>
          )}
        </div>
      )}

      {/* LinkedIn-style action bar */}
      {!preview && (
        <div className="flex border-t border-gray-100">
          <LoginPromptButton
            action="like this post"
            className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-[#0F6E56] transition-colors"
          >
            <ThumbsUp className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Like</span>
          </LoginPromptButton>

          <button
            onClick={() => setCommentsOpen((v) => !v)}
            className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-[#0F6E56] transition-colors"
          >
            <MessageCircle className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Comment</span>
          </button>

          <LoginPromptButton
            action="save this post"
            className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-[#0F6E56] transition-colors"
          >
            <Bookmark className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Save</span>
          </LoginPromptButton>

          <LoginPromptButton
            action="share this post"
            className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-[#0F6E56] transition-colors"
          >
            <Share2 className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Share</span>
          </LoginPromptButton>
        </div>
      )}

      {/* Comments */}
      {!preview && commentsOpen && commentCount > 0 && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-3">
          {post.comments.map((comment) => (
            <CommentThread key={comment.id} comment={comment} />
          ))}
          <LoginPromptButton
            action="add a comment"
            className="mt-2 w-full flex items-center gap-2 rounded-xl border border-dashed border-gray-200 px-4 py-2.5 text-xs text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors"
          >
            <span className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">
              ?
            </span>
            Add a comment…
          </LoginPromptButton>
        </div>
      )}
    </article>
  );
}

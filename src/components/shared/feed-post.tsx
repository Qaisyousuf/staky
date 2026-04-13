"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  ThumbsUp,
  MessageCircle,
  BadgeCheck,
  Star,
  Send,
  ChevronDown,
  ChevronUp,
  UserPlus,
  UserCheck,
  Loader2,
  ExternalLink,
  X,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolIcon, type DbTool } from "@/components/shared/tool-icon";
import {
  getUrlDomain,
  splitPostContent,
} from "@/lib/post-utils";
import {
  toggleLike,
  toggleRecommend,
  toggleFollow,
  toggleConnect,
  addComment,
  getPostComments,
} from "@/actions/social";

export interface FeedPostData {
  id: string;
  fromTool: string;
  toTool: string;
  fromToolData?: DbTool | null;
  toToolData?: DbTool | null;
  story: string;
  tags: string[];
  imageUrls: string[];
  linkUrl: string | null;
  linkTitle: string | null;
  linkDescription: string | null;
  linkImage: string | null;
  linkDomain: string | null;
  createdAt: string;
  postedAsPartner: boolean;
  author: {
    id: string;
    name: string | null;
    image: string | null;
    role: string;
    verified: boolean;
    title: string | null;
    company: string | null;
    partner?: {
      rating: number;
      projectCount: number;
      companyName: string;
      logoUrl: string | null;
    } | null;
  };
  likeCount: number;
  recommendCount: number;
  saveCount: number;
  commentCount: number;
}

export type SerializedComment = {
  id: string;
  authorId: string;
  postId: string;
  parentId: string | null;
  content: string;
  senderMode?: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    role: string;
    image?: string | null;
    partner?: { companyName: string; logoUrl?: string | null } | null;
  };
  replies: SerializedComment[];
};

interface FeedPostProps {
  post: FeedPostData;
  currentUserId?: string;
  currentUserImage?: string | null;
  initialLiked?: boolean;
  initialSaved?: boolean;
  initialRecommended?: boolean;
  initialFollowing?: boolean;
  initialConnected?: boolean;
  autoExpandComments?: boolean;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}

function Avatar({
  name,
  image,
  size = 10,
  rounded = "full",
}: {
  name: string | null;
  image?: string | null;
  size?: number;
  rounded?: "full" | "xl";
}) {
  const className = `h-${size} w-${size} rounded-${rounded} shrink-0 bg-[#0F6E56] flex items-center justify-center text-white text-xs font-bold select-none`;
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt={name ?? ""} className={cn(className, "object-cover")} />;
  }
  return <div className={className}>{initials(name)}</div>;
}

function SwitchCard({ post }: { post: FeedPostData }) {
  const fromName = post.fromToolData?.name ?? post.fromTool;
  const toName = post.toToolData?.name ?? post.toTool;
  if (!fromName && !toName) return null;
  return (
    <div className="flex items-center justify-center gap-3">
      {/* From card */}
      <div
        className="flex items-center gap-2.5 rounded-xl bg-white px-4 py-2.5"
        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.03)" }}
      >
        <ToolIcon
          toolData={post.fromToolData ?? undefined}
          slug={post.fromToolData ? undefined : post.fromTool}
          size="md"
          plain
          className="h-9 w-9 object-contain"
        />
        <span className="text-[13px] font-semibold text-[#4a5249]">{fromName}</span>
      </div>

      <ArrowRight className="h-4 w-4 shrink-0 text-[#0F6E56]" />

      {/* To card */}
      <div
        className="flex items-center gap-2.5 rounded-xl bg-white px-4 py-2.5"
        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.03)" }}
      >
        <ToolIcon
          toolData={post.toToolData ?? undefined}
          slug={post.toToolData ? undefined : post.toTool}
          size="md"
          plain
          className="h-9 w-9 object-contain"
        />
        <span className="text-[13px] font-bold text-[#0F6E56]">{toName}</span>
        {post.toToolData?.country && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://flagcdn.com/16x12/${post.toToolData.country}.png`}
            width={13}
            height={9}
            alt={post.toToolData.country}
            className="rounded-[2px] opacity-75"
          />
        )}
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  postId,
  currentUserId,
  currentUserImage,
  depth = 0,
}: {
  comment: SerializedComment;
  postId: string;
  currentUserId?: string;
  currentUserImage?: string | null;
  depth?: number;
}) {
  const [replying, setReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replies, setReplies] = useState(comment.replies);
  const [pending, startTransition] = useTransition();

  const handleReply = () => {
    if (!replyText.trim()) return;
    startTransition(async () => {
      try {
        const newReply = await addComment(postId, replyText.trim(), comment.id);
        const replyItem: SerializedComment = {
          id: newReply.id,
          authorId: newReply.author.id,
          postId,
          parentId: comment.id,
          content: newReply.content,
          createdAt: newReply.createdAt,
          author: newReply.author,
          replies: [],
        };
        setReplies((current) => [...current, replyItem]);
        setReplyText("");
        setReplying(false);
        setShowReplies(true);
      } catch {}
    });
  };

  const isPartnerComment = comment.senderMode === "partner" && !!comment.author.partner;
  const commentDisplayName = isPartnerComment
    ? (comment.author.partner?.companyName ?? comment.author.name)
    : comment.author.name;
  const commentDisplayImage = isPartnerComment
    ? (comment.author.partner?.logoUrl ?? comment.author.image)
    : comment.author.image;

  return (
    <div id={`comment-${comment.id}`} className={cn("flex gap-2.5", depth > 0 && "ml-9 mt-2")}>
      <Avatar
        name={commentDisplayName}
        image={commentDisplayImage}
        size={7}
        rounded={isPartnerComment ? "xl" : "full"}
      />
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-[#f5f3ef] px-3.5 py-2.5">
          <div className="flex flex-wrap items-baseline gap-1.5">
            <span className="text-[13px] font-semibold text-[#1B2B1F]">{commentDisplayName}</span>
            <span className="text-[10px] text-[#9ba39c]">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="mt-0.5 text-[13px] leading-snug text-[#495346]">{comment.content}</p>
        </div>

        <div className="mt-1 ml-1 flex items-center gap-3">
          {currentUserId && depth === 0 && (
            <button
              onClick={() => setReplying((v) => !v)}
              className="text-[11px] font-semibold text-[#9ba39c] transition-colors hover:text-[#0F6E56]"
            >
              Reply
            </button>
          )}
          {replies.length > 0 && (
            <button
              onClick={() => setShowReplies((v) => !v)}
              className="flex items-center gap-0.5 text-[11px] text-[#9ba39c] transition-colors hover:text-[#495346]"
            >
              {showReplies ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {replies.length} {replies.length === 1 ? "reply" : "replies"}
            </button>
          )}
        </div>

        {replying && (
          <div className="mt-2 flex items-center gap-2">
            <Avatar name={null} image={currentUserImage} size={6} />
            <div className="flex flex-1 items-center gap-1 rounded-full border border-[#e8e2d8] bg-white px-3 py-1.5 focus-within:border-[#0F6E56]">
              <input
                autoFocus
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleReply()}
                placeholder="Write a reply…"
                className="flex-1 bg-transparent text-[12px] text-[#1B2B1F] outline-none placeholder:text-[#bbb5aa]"
              />
              <button
                onClick={handleReply}
                disabled={!replyText.trim() || pending}
                className="text-[#0F6E56] transition-opacity disabled:opacity-40"
              >
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        )}

        {showReplies &&
          replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              currentUserId={currentUserId}
              currentUserImage={currentUserImage}
              depth={depth + 1}
            />
          ))}
      </div>
    </div>
  );
}

function LinkPreview({
  url,
  title,
  description,
  image,
  domain,
}: {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  domain: string | null;
}) {
  const displayDomain = domain || getUrlDomain(url);
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="block overflow-hidden rounded-[18px] border border-[#ece7dc] bg-white transition-all duration-200 hover:border-[#d8d1c3]"
      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)" }}
    >
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="aspect-[1.91/1] max-h-[300px] w-full object-cover" />
      )}
      <div className="border-t border-[#ece7dc] px-4 py-3">
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-[#9ba39c]">{displayDomain}</p>
            <p className="mt-0.5 line-clamp-2 text-[13px] font-semibold leading-snug text-[#1B2B1F]">
              {title || url}
            </p>
            {description && (
              <p className="mt-0.5 line-clamp-2 text-[12px] leading-5 text-[#667065]">{description}</p>
            )}
          </div>
          <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#9ba39c]" />
        </div>
      </div>
    </a>
  );
}

function ImageGallery({
  imageUrls,
  onOpen,
}: {
  imageUrls: string[];
  onOpen: (index: number) => void;
}) {
  if (imageUrls.length === 0) return null;
  if (imageUrls.length === 1) {
    return (
      <button
        type="button"
        onClick={() => onOpen(0)}
        className="block w-full overflow-hidden rounded-[18px] border border-[#ece7dc] bg-[#f8f6f2]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrls[0]} alt="" className="w-full rounded-[18px] object-contain" style={{ maxHeight: 480 }} />
      </button>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {imageUrls.map((url, index) => (
        <button
          key={url}
          type="button"
          onClick={() => onOpen(index)}
          className="block overflow-hidden rounded-[14px] border border-[#ece7dc] bg-[#f8f6f2]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="w-full rounded-[14px] object-contain" style={{ maxHeight: 280 }} />
        </button>
      ))}
    </div>
  );
}

const STORY_PREVIEW = 240;

export function FeedPost({
  post,
  currentUserId,
  currentUserImage,
  initialLiked = false,
  initialRecommended = false,
  initialFollowing = false,
  initialConnected = false,
  autoExpandComments = false,
}: FeedPostProps) {
  const isOwn = currentUserId === post.author.id;
  const isPartner = post.postedAsPartner;
  const displayName = isPartner ? (post.author.partner?.companyName ?? post.author.name) : post.author.name;
  const displayImage = isPartner ? (post.author.partner?.logoUrl ?? post.author.image) : post.author.image;
  const { text, hashtags } = splitPostContent(post.story, post.tags);

  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [recommended, setRecommended] = useState(initialRecommended);
  const [recommendCount, setRecommendCount] = useState(post.recommendCount);
  const [following, setFollowing] = useState(initialFollowing);
  const [connected, setConnected] = useState(initialConnected);
  const [expanded, setExpanded] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(autoExpandComments);
  const [comments, setComments] = useState<SerializedComment[] | null>(null);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  const [isPending, startTransition] = useTransition();

  const isLong = text.length > STORY_PREVIEW;
  const displayStory = expanded || !isLong ? text : text.slice(0, STORY_PREVIEW);

  useEffect(() => {
    if (!commentsOpen || comments !== null) return;
    setLoadingComments(true);
    getPostComments(post.id)
      .then((rows) => setComments(rows as unknown as SerializedComment[]))
      .catch(() => setComments([]))
      .finally(() => setLoadingComments(false));
  }, [commentsOpen, comments, post.id]);

  useEffect(() => {
    if (commentsOpen || comments !== null || post.commentCount === 0) return;
    getPostComments(post.id)
      .then((rows) => setComments(rows as unknown as SerializedComment[]))
      .catch(() => {});
  }, [commentsOpen, comments, post.commentCount, post.id]);

  function handleLike() {
    if (!currentUserId) return;
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      try {
        const res = await toggleLike(post.id);
        setLiked(res.liked);
        setLikeCount(res.count);
      } catch {
        setLiked(!next);
        setLikeCount((c) => c + (next ? -1 : 1));
      }
    });
  }

  function handleRecommend() {
    if (!currentUserId) return;
    const next = !recommended;
    setRecommended(next);
    setRecommendCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      try {
        const res = await toggleRecommend(post.id);
        setRecommended(res.recommended);
        setRecommendCount(res.count);
      } catch {
        setRecommended(!next);
        setRecommendCount((c) => c + (next ? -1 : 1));
      }
    });
  }

  // Which persona of the author does this post represent?
  const authorPersonaMode = post.postedAsPartner ? "partner" : "user";

  function handleFollow() {
    if (!currentUserId || isOwn) return;
    setFollowing((v) => !v);
    startTransition(async () => {
      try {
        const res = await toggleFollow(post.author.id, authorPersonaMode);
        setFollowing(res.following);
      } catch {
        setFollowing((v) => !v);
      }
    });
  }

  function handleConnect() {
    if (!currentUserId || isOwn) return;
    setConnected((v) => !v);
    startTransition(async () => {
      try {
        const res = await toggleConnect(post.author.id, authorPersonaMode);
        setConnected(res.connected);
      } catch {
        setConnected((v) => !v);
      }
    });
  }

  function handleComment() {
    if (!newComment.trim()) return;
    startTransition(async () => {
      try {
        const comment = await addComment(post.id, newComment.trim());
        const item: SerializedComment = {
          id: comment.id,
          authorId: comment.author.id,
          postId: post.id,
          parentId: null,
          content: comment.content,
          createdAt: comment.createdAt,
          author: comment.author,
          replies: [],
        };
        setComments((c) => [...(c ?? []), item]);
        setCommentCount((c) => c + 1);
        setNewComment("");
      } catch {}
    });
  }

  return (
    <>
      <article
        id={`post-${post.id}`}
        className={cn(
          "overflow-hidden rounded-2xl bg-white",
          isPartner && "border-l-[3px] border-l-[#2A5FA5]"
        )}
        style={{
          border: isPartner ? undefined : "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar
              name={displayName}
              image={displayImage}
              size={11}
              rounded={isPartner ? "xl" : "full"}
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1 leading-tight">
                <span className="text-[14px] font-bold text-[#1B2B1F] leading-tight">{displayName}</span>
                {(post.author.verified || isPartner) && (
                  <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#2A5FA5]" />
                )}
              </div>
              {!isPartner && (post.author.title || post.author.company) && (
                <p className="truncate text-[12px] text-[#8a9090] leading-tight">
                  {[post.author.title, post.author.company].filter(Boolean).join(" · ")}
                </p>
              )}
              <span className="text-[11px] text-[#b0b8b0] mt-0.5 block">{timeAgo(post.createdAt)}</span>
            </div>
          </div>

          {/* Follow / Connect */}
          {!isOwn && currentUserId && isPartner && (
            <button
              onClick={handleConnect}
              disabled={isPending}
              className={cn(
                "shrink-0 flex items-center gap-1 rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors",
                connected
                  ? "border-[#2A5FA5] bg-blue-50 text-[#2A5FA5]"
                  : "border-[#e0d9cf] text-[#7a837a] hover:border-[#2A5FA5] hover:text-[#2A5FA5]"
              )}
            >
              {connected ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
              {connected ? "Connected" : "Connect"}
            </button>
          )}
          {!isOwn && currentUserId && !isPartner && (
            <button
              onClick={handleFollow}
              disabled={isPending}
              className={cn(
                "shrink-0 flex items-center gap-1 rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors",
                following
                  ? "border-[#0F6E56] bg-green-50 text-[#0F6E56]"
                  : "border-[#e0d9cf] text-[#7a837a] hover:border-[#0F6E56] hover:text-[#0F6E56]"
              )}
            >
              {following ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
              {following ? "Following" : "Follow"}
            </button>
          )}
          {!currentUserId && (
            <a
              href="/login"
              className="shrink-0 flex items-center gap-1 rounded-full border border-[#e0d9cf] px-3 py-1 text-[12px] font-semibold text-[#7a837a] transition-colors hover:border-[#0F6E56] hover:text-[#0F6E56]"
            >
              <UserPlus className="h-3.5 w-3.5" />
              {isPartner ? "Connect" : "Follow"}
            </a>
          )}
        </div>

        {/* ── Switch card ── */}
        {(post.fromTool || post.toTool) && (
          <div className="px-4 pb-2">
            <SwitchCard post={post} />
          </div>
        )}

        {/* ── Body ── */}
        <div className="px-4 pb-3">
          {text && (
            <div className="text-[14px] leading-[1.7] text-[#3a4a3c] whitespace-pre-line">
              {displayStory}
              {isLong && !expanded && (
                <button
                  onClick={() => setExpanded(true)}
                  className="ml-1 font-semibold text-[#0F6E56] hover:underline"
                >
                  …more
                </button>
              )}
            </div>
          )}
          {isLong && expanded && (
            <button
              onClick={() => setExpanded(false)}
              className="mt-1 text-[12px] font-semibold text-[#0F6E56] hover:underline"
            >
              Show less
            </button>
          )}

          {hashtags.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {hashtags.map((tag) => (
                <Link
                  key={tag}
                  href={`/feed?tag=${encodeURIComponent(tag)}`}
                  className="text-[12px] font-medium text-[#0F6E56] transition-colors hover:underline"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {post.imageUrls.length > 0 && (
            <div className="mt-3">
              <ImageGallery imageUrls={post.imageUrls} onOpen={setActiveImageIndex} />
            </div>
          )}

          {post.linkUrl && (
            <div className="mt-3">
              <LinkPreview
                url={post.linkUrl}
                title={post.linkTitle}
                description={post.linkDescription}
                image={post.linkImage}
                domain={post.linkDomain}
              />
            </div>
          )}
        </div>

        {/* ── Engagement counts ── */}
        {(likeCount > 0 || recommendCount > 0 || commentCount > 0) && (
          <div className="flex items-center justify-between gap-2 border-t border-[#f0ece4] px-4 py-2 text-[12px] text-[#9ba39c]">
            <div className="flex items-center gap-3">
              {likeCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#0F6E56]">
                    <ThumbsUp className="h-2.5 w-2.5 text-white" />
                  </span>
                  {liked && currentUserImage && (
                    <Avatar name={null} image={currentUserImage} size={5} />
                  )}
                  <span>{likeCount}</span>
                </span>
              )}
              {recommendCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-amber-400">
                    <Star className="h-2.5 w-2.5 text-white" />
                  </span>
                  {recommended && currentUserImage && (
                    <Avatar name={null} image={currentUserImage} size={5} />
                  )}
                  <span>{recommendCount}</span>
                </span>
              )}
            </div>
            {commentCount > 0 && (
              <button
                onClick={() => setCommentsOpen((v) => !v)}
                className="transition-colors hover:text-[#495346]"
              >
                {commentCount} comment{commentCount !== 1 ? "s" : ""}
              </button>
            )}
          </div>
        )}

        {/* ── Comment preview ── */}
        {!commentsOpen && commentCount > 0 && comments && comments.length > 0 && (
          <button
            onClick={() => setCommentsOpen(true)}
            className="flex w-full items-start gap-2.5 border-t border-[#f0ece4] px-4 py-3 text-left transition-colors hover:bg-[#faf8f4]"
          >
            {(() => {
              const c0 = comments[0];
              const c0IsPartner = c0.senderMode === "partner" && !!c0.author.partner;
              const c0Name = c0IsPartner ? (c0.author.partner?.companyName ?? c0.author.name) : c0.author.name;
              const c0Image = c0IsPartner ? (c0.author.partner?.logoUrl ?? c0.author.image) : c0.author.image;
              return (
                <>
                  <Avatar name={c0Name} image={c0Image} size={6} rounded={c0IsPartner ? "xl" : "full"} />
                  <div className="min-w-0 flex-1 rounded-2xl bg-[#f5f3ef] px-3 py-2">
                    <span className="text-[12px] font-semibold text-[#1B2B1F]">
                      {c0Name}
                    </span>
                    <p className="mt-0.5 line-clamp-1 text-[12px] text-[#667065]">
                      {c0.content}
                    </p>
                  </div>
                </>
              );
            })()}
          </button>
        )}

        {/* ── Action bar ── */}
        <div className="grid grid-cols-3 border-t border-[#f0ece4]">
          <button
            onClick={handleLike}
            className={cn(
              "flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-medium transition-colors",
              liked
                ? "text-[#0F6E56] bg-green-50"
                : "text-[#7a837a] hover:bg-[#faf8f4] hover:text-[#0F6E56]"
            )}
          >
            <ThumbsUp className={cn("h-4 w-4", liked && "fill-[#0F6E56]")} />
            <span>Like</span>
          </button>

          <button
            onClick={() => setCommentsOpen((v) => !v)}
            className={cn(
              "flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-medium transition-colors border-x border-[#f0ece4]",
              commentsOpen ? "text-[#0F6E56] bg-green-50" : "text-[#7a837a] hover:bg-[#faf8f4] hover:text-[#0F6E56]"
            )}
          >
            <MessageCircle className="h-4 w-4" />
            <span>Comment</span>
          </button>

          <button
            onClick={handleRecommend}
            className={cn(
              "flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-medium transition-colors",
              recommended
                ? "text-amber-500 bg-amber-50"
                : "text-[#7a837a] hover:bg-[#faf8f4] hover:text-amber-500"
            )}
          >
            <Star className={cn("h-4 w-4", recommended && "fill-amber-500")} />
            <span>Recommend</span>
          </button>
        </div>

        {/* ── Comments section ── */}
        {commentsOpen && (
          <div className="space-y-3 border-t border-[#f0ece4] px-4 pb-4 pt-3">
            {loadingComments && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-[#c8c0b4]" />
              </div>
            )}

            {comments?.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                postId={post.id}
                currentUserId={currentUserId}
                currentUserImage={currentUserImage}
              />
            ))}

            {currentUserId ? (
              <div className="flex items-center gap-2 pt-1">
                <Avatar name={null} image={currentUserImage} size={8} />
                <div className="flex flex-1 items-center gap-2 rounded-full border border-[#e8e2d8] bg-[#faf8f4] px-4 py-2 transition-colors focus-within:border-[#0F6E56] focus-within:bg-white">
                  <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleComment()}
                    placeholder="Write a comment…"
                    className="flex-1 bg-transparent text-[13px] text-[#1B2B1F] outline-none placeholder:text-[#bbb5aa]"
                  />
                  <button
                    onClick={handleComment}
                    disabled={!newComment.trim() || isPending}
                    className="text-[#0F6E56] transition-opacity disabled:opacity-40"
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <a
                href="/login"
                className="flex items-center gap-2 rounded-xl border border-dashed border-[#e0d9cf] px-4 py-2.5 text-[13px] text-[#9ba39c] transition-colors hover:border-[#c8c0b4] hover:text-[#667065]"
              >
                Sign in to comment
              </a>
            )}
          </div>
        )}
      </article>

      {/* ── Lightbox ── */}
      {activeImageIndex !== null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setActiveImageIndex(null)}
        >
          <button
            type="button"
            onClick={() => setActiveImageIndex(null)}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrls[activeImageIndex]}
            alt=""
            className="max-h-[90vh] max-w-[94vw] rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

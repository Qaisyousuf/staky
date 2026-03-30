"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  ThumbsUp,
  MessageCircle,
  Bookmark,
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SwitchBadge } from "@/components/shared/tool-icon";
import {
  getUrlDomain,
  splitPostContent,
} from "@/lib/post-utils";
import {
  toggleLike,
  toggleSave,
  toggleRecommend,
  toggleFollow,
  addComment,
  getPostComments,
} from "@/actions/social";

export interface FeedPostData {
  id: string;
  fromTool: string;
  toTool: string;
  story: string;
  tags: string[];
  imageUrls: string[];
  linkUrl: string | null;
  linkTitle: string | null;
  linkDescription: string | null;
  linkImage: string | null;
  linkDomain: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
    role: string;
    verified: boolean;
    title: string | null;
    company: string | null;
    partner?: { rating: number; projectCount: number } | null;
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
  createdAt: string;
  author: { id: string; name: string | null; role: string; image?: string | null };
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
  autoExpandComments?: boolean;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
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

  return (
    <div id={`comment-${comment.id}`} className={cn("flex gap-2.5", depth > 0 && "ml-8 mt-2")}>
      <Avatar name={comment.author.name} image={comment.author.image} size={7} />
      <div className="min-w-0 flex-1">
        <div className="rounded-xl bg-gray-50 px-3 py-2.5">
          <div className="flex flex-wrap items-baseline gap-1.5">
            <span className="text-xs font-semibold text-gray-800">{comment.author.name}</span>
            <span className="text-[10px] text-gray-400">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="mt-0.5 text-sm leading-snug text-gray-700">{comment.content}</p>
        </div>

        <div className="mt-1 ml-1 flex items-center gap-3">
          {currentUserId && depth === 0 && (
            <button
              onClick={() => setReplying((value) => !value)}
              className="text-[11px] font-medium text-gray-400 transition-colors hover:text-[#0F6E56]"
            >
              Reply
            </button>
          )}
          {replies.length > 0 && (
            <button
              onClick={() => setShowReplies((value) => !value)}
              className="flex items-center gap-0.5 text-[11px] text-gray-400 transition-colors hover:text-gray-600"
            >
              {showReplies ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {replies.length} {replies.length === 1 ? "reply" : "replies"}
            </button>
          )}
        </div>

        {replying && (
          <div className="mt-2 flex items-center gap-2">
            <Avatar name={null} image={currentUserImage} size={6} />
            <div className="flex flex-1 items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5">
              <input
                autoFocus
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && !event.shiftKey && handleReply()}
                placeholder="Write a reply…"
                className="flex-1 bg-transparent text-xs text-gray-700 outline-none placeholder:text-gray-400"
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
      className="block overflow-hidden rounded-2xl border border-gray-200 bg-white transition-colors hover:border-gray-300 hover:shadow-sm"
    >
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="aspect-[1.91/1] w-full object-cover" />
      )}
      <div className="border-t border-gray-100 bg-[#f8fafb] p-4">
        <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">{displayDomain}</p>
          <p className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug text-gray-900">
            {title || url}
          </p>
          {description && (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-500">{description}</p>
          )}
          {!title && (
            <p className="mt-1 truncate text-xs text-[#0F6E56]">{url}</p>
          )}
        </div>
        <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
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
      <button type="button" onClick={() => onOpen(0)} className="block w-full overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrls[0]} alt="" className="max-h-[520px] w-full rounded-2xl object-cover" />
      </button>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {imageUrls.map((url, index) => (
        <button
          key={url}
          type="button"
          onClick={() => onOpen(index)}
          className="block overflow-hidden rounded-2xl"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="aspect-[4/3] w-full rounded-2xl object-cover" />
        </button>
      ))}
    </div>
  );
}

const STORY_PREVIEW = 220;

export function FeedPost({
  post,
  currentUserId,
  currentUserImage,
  initialLiked = false,
  initialSaved = false,
  initialRecommended = false,
  initialFollowing = false,
  autoExpandComments = false,
}: FeedPostProps) {
  const isOwn = currentUserId === post.author.id;
  const isPartner = post.author.role === "PARTNER";
  const { text, hashtags } = splitPostContent(post.story, post.tags);

  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [saved, setSaved] = useState(initialSaved);
  const [recommended, setRecommended] = useState(initialRecommended);
  const [recommendCount, setRecommendCount] = useState(post.recommendCount);
  const [following, setFollowing] = useState(initialFollowing);
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

  function handleLike() {
    if (!currentUserId) return;
    const next = !liked;
    setLiked(next);
    setLikeCount((count) => count + (next ? 1 : -1));
    startTransition(async () => {
      try {
        const response = await toggleLike(post.id);
        setLiked(response.liked);
        setLikeCount(response.count);
      } catch {
        setLiked(!next);
        setLikeCount((count) => count + (next ? -1 : 1));
      }
    });
  }

  function handleSave() {
    if (!currentUserId) return;
    setSaved((value) => !value);
    startTransition(async () => {
      try {
        const response = await toggleSave(post.id);
        setSaved(response.saved);
      } catch {
        setSaved((value) => !value);
      }
    });
  }

  function handleRecommend() {
    if (!currentUserId) return;
    const next = !recommended;
    setRecommended(next);
    setRecommendCount((count) => count + (next ? 1 : -1));
    startTransition(async () => {
      try {
        const response = await toggleRecommend(post.id);
        setRecommended(response.recommended);
        setRecommendCount(response.count);
      } catch {
        setRecommended(!next);
        setRecommendCount((count) => count + (next ? -1 : 1));
      }
    });
  }

  function handleFollow() {
    if (!currentUserId || isOwn) return;
    setFollowing((value) => !value);
    startTransition(async () => {
      try {
        const response = await toggleFollow(post.author.id);
        setFollowing(response.following);
      } catch {
        setFollowing((value) => !value);
      }
    });
  }

  function handleComment() {
    if (!newComment.trim()) return;
    startTransition(async () => {
      try {
        const comment = await addComment(post.id, newComment.trim());
        const commentItem: SerializedComment = {
          id: comment.id,
          authorId: comment.author.id,
          postId: post.id,
          parentId: null,
          content: comment.content,
          createdAt: comment.createdAt,
          author: comment.author,
          replies: [],
        };
        setComments((current) => [...(current ?? []), commentItem]);
        setCommentCount((count) => count + 1);
        setNewComment("");
      } catch {}
    });
  }

  return (
    <>
      <article
        id={`post-${post.id}`}
        className={cn(
          "overflow-hidden rounded-xl border border-gray-200 bg-white",
          isPartner && "border-l-[3px] border-l-[#2A5FA5]"
        )}
      >
        <div className="p-4 sm:p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar
                name={post.author.name}
                image={post.author.image}
                size={isPartner ? 11 : 10}
                rounded={isPartner ? "xl" : "full"}
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate text-sm font-semibold text-gray-900">{post.author.name}</span>
                  {post.author.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#2A5FA5]" />}
                  {isPartner && (
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#2A5FA5]">
                      Migration Partner
                    </span>
                  )}
                </div>
                {(post.author.title || post.author.company) && (
                  <p className="truncate text-xs text-gray-400">
                    {[post.author.title, post.author.company].filter(Boolean).join(" · ")}
                  </p>
                )}
                <p className="text-[10px] text-gray-400">{timeAgo(post.createdAt)}</p>
                {isPartner && post.author.partner && (
                  <div className="mt-0.5 flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-[10px] font-semibold text-gray-600">
                      {post.author.partner.rating.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      · {post.author.partner.projectCount} projects
                    </span>
                  </div>
                )}
              </div>
            </div>

            {!isOwn && currentUserId && (
              <button
                onClick={handleFollow}
                disabled={isPending}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  following
                    ? "border-[#0F6E56] bg-green-50 text-[#0F6E56]"
                    : "border-gray-300 text-gray-600 hover:border-[#0F6E56] hover:text-[#0F6E56]"
                )}
              >
                {following ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                {following ? "Following" : "Follow"}
              </button>
            )}
            {!currentUserId && (
              <a
                href="/login"
                className="shrink-0 rounded-full border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-[#0F6E56] hover:text-[#0F6E56]"
              >
                {isPartner ? "Connect" : "Follow"}
              </a>
            )}
          </div>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5">
            <SwitchBadge from={post.fromTool} to={post.toTool} size="sm" />
          </div>

          {hashtags.length > 0 && (
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {hashtags.map((tag) => (
                <Link
                  key={tag}
                  href={`/feed?tag=${encodeURIComponent(tag)}`}
                  className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 transition-colors hover:bg-gray-200 hover:text-[#0F6E56]"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {text && (
            <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
              {displayStory}
              {isLong && !expanded && "…"}
            </div>
          )}
          {isLong && (
            <button
              onClick={() => setExpanded((value) => !value)}
              className="mt-1 text-xs font-semibold text-[#0F6E56] hover:underline"
            >
              {expanded ? "Show less" : "…see more"}
            </button>
          )}

          {post.imageUrls.length > 0 && (
            <div className={cn("mt-4", !text && hashtags.length === 0 && "mt-0")}>
              <ImageGallery imageUrls={post.imageUrls} onOpen={setActiveImageIndex} />
            </div>
          )}

          {post.linkUrl && (
            <div className="mt-4">
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

        {(likeCount > 0 || recommendCount > 0 || commentCount > 0) && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-1.5 text-[11px] text-gray-400">
            <span>
              {likeCount > 0 && `${likeCount} like${likeCount !== 1 ? "s" : ""}`}
              {likeCount > 0 && recommendCount > 0 && " · "}
              {recommendCount > 0 &&
                `${recommendCount} recommendation${recommendCount !== 1 ? "s" : ""}`}
            </span>
            {commentCount > 0 && (
              <button
                onClick={() => setCommentsOpen((value) => !value)}
                className="transition-colors hover:text-gray-700"
              >
                {commentCount} comment{commentCount !== 1 ? "s" : ""}
              </button>
            )}
          </div>
        )}

        <div className="flex border-t border-gray-100">
          <button
            onClick={handleLike}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
              liked
                ? "bg-green-50 text-[#0F6E56] hover:bg-green-100"
                : "text-gray-500 hover:bg-gray-50 hover:text-[#0F6E56]"
            )}
          >
            <ThumbsUp className={cn("h-4 w-4 shrink-0", liked && "fill-[#0F6E56]")} />
            <span className="hidden sm:inline">Like</span>
          </button>

          <button
            onClick={() => setCommentsOpen((value) => !value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
              commentsOpen ? "bg-green-50 text-[#0F6E56]" : "text-gray-500 hover:bg-gray-50 hover:text-[#0F6E56]"
            )}
          >
            <MessageCircle className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Comment</span>
          </button>

          <button
            onClick={handleSave}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
              saved
                ? "bg-green-50 text-[#0F6E56] hover:bg-green-100"
                : "text-gray-500 hover:bg-gray-50 hover:text-[#0F6E56]"
            )}
          >
            <Bookmark className={cn("h-4 w-4 shrink-0", saved && "fill-[#0F6E56]")} />
            <span className="hidden sm:inline">Save</span>
          </button>

          <button
            onClick={handleRecommend}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
              recommended
                ? "bg-amber-50 text-amber-500 hover:bg-amber-100"
                : "text-gray-500 hover:bg-gray-50 hover:text-amber-500"
            )}
          >
            <Star className={cn("h-4 w-4 shrink-0", recommended && "fill-amber-500")} />
            <span className="hidden sm:inline">Recommend</span>
          </button>
        </div>

        {commentsOpen && (
          <div className="space-y-3 border-t border-gray-100 px-5 pb-5 pt-4">
            {loadingComments && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
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
                <Avatar name={null} image={currentUserImage} size={7} />
                <div className="flex flex-1 items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 transition-colors focus-within:border-[#0F6E56] focus-within:bg-white">
                  <input
                    value={newComment}
                    onChange={(event) => setNewComment(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && !event.shiftKey && handleComment()}
                    placeholder="Add a comment…"
                    className="flex-1 bg-transparent text-xs text-gray-700 outline-none placeholder:text-gray-400"
                  />
                  <button
                    onClick={handleComment}
                    disabled={!newComment.trim() || isPending}
                    className="text-[#0F6E56] transition-opacity disabled:opacity-40"
                  >
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            ) : (
              <a
                href="/login"
                className="flex items-center gap-2 rounded-xl border border-dashed border-gray-200 px-4 py-2.5 text-xs text-gray-400 transition-colors hover:border-gray-300 hover:text-gray-500"
              >
                Sign in to comment
              </a>
            )}
          </div>
        )}
      </article>

      {activeImageIndex !== null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActiveImageIndex(null)}
        >
          <button
            type="button"
            onClick={() => setActiveImageIndex(null)}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrls[activeImageIndex]}
            alt=""
            className="max-h-[88vh] max-w-[92vw] rounded-2xl object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

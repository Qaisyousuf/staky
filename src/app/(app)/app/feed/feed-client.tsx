"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Layers,
  Loader2,
  Users,
  Handshake,
  Globe,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FeedPost } from "@/components/shared/feed-post";
import type { FeedPostData } from "@/components/shared/feed-post";
import { FeedComposer } from "@/components/shared/feed-composer";
import { FeedScrollHandler } from "@/components/shared/feed-scroll-handler";
import { getAppFeedPosts, checkNewPosts } from "@/actions/feed";
import type { AppFeedFilter } from "@/actions/feed";
import { POPULAR_SWITCHES, TOOLS } from "@/data/mock-data";
import { ToolIcon } from "@/components/shared/tool-icon";
import { toggleFollow } from "@/actions/social";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SuggestedUser {
  id: string;
  name: string | null;
  image: string | null;
  title: string | null;
  company: string | null;
  role: string;
  partner?: { companyName: string; logoUrl: string | null; approved: boolean } | null;
}

interface FeedClientProps {
  initialPosts: FeedPostData[];
  initialLikedIds: string[];
  initialSavedIds: string[];
  initialRecommendedIds: string[];
  initialFollowingIds: string[];
  initialConnectedIds: string[];
  initialHasMore: boolean;
  initialNextCursor?: string;
  filter: AppFeedFilter;
  currentUserId: string;
  currentUserImage: string | null;
  userName: string;
  userInitials: string;
  isPartnerMode: boolean;
  partnerName: string | null;
  partnerLogoUrl: string | null;
  loadedAt: string;
  targetPostId?: string;
  targetCommentId?: string;
  suggestedUsers: SuggestedUser[];
  stackSlugs: string[];
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

const FILTERS: { value: AppFeedFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "following", label: "Following" },
  { value: "community", label: "Community" },
  { value: "partners", label: "Partners" },
];

function FilterTabs({ active }: { active: AppFeedFilter }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 flex overflow-hidden mb-3">
      {FILTERS.map((f) => (
        <Link
          key={f.value}
          href={f.value === "all" ? "/app/feed" : `/app/feed?filter=${f.value}`}
          className={cn(
            "flex-1 py-2.5 text-xs font-semibold text-center transition-colors",
            active === f.value
              ? "bg-[#0F6E56] text-white"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
          )}
        >
          {f.label}
        </Link>
      ))}
    </div>
  );
}

// ─── Follow button for suggested users ───────────────────────────────────────

function SuggestedFollowButton({ userId }: { userId: string }) {
  const [following, setFollowing] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleFollow() {
    if (pending) return;
    setPending(true);
    const next = !following;
    setFollowing(next);
    try {
      const res = await toggleFollow(userId);
      setFollowing(res.following);
    } catch {
      setFollowing(!next);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={handleFollow}
      disabled={pending}
      className={cn(
        "shrink-0 h-7 px-3 rounded-full text-[11px] font-semibold border transition-colors disabled:opacity-50",
        following
          ? "bg-green-50 border-[#0F6E56] text-[#0F6E56]"
          : "border-gray-300 text-gray-600 hover:border-[#0F6E56] hover:text-[#0F6E56]"
      )}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}

// ─── Right sidebar ─────────────────────────────────────────────────────────────

function RightSidebar({ suggested, stackSlugs }: { suggested: SuggestedUser[]; stackSlugs: string[] }) {
  return (
    <aside className="space-y-3">
      {/* Grow your network */}
      {suggested.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
              People to follow
            </h3>
          </div>
          <div className="p-3 space-y-1">
            {suggested.map((u) => {
              const uIsPartner = u.role === "PARTNER" && !!u.partner?.approved;
              const uDisplayName = uIsPartner ? (u.partner!.companyName ?? u.name) : u.name;
              const uDisplayImage = uIsPartner ? (u.partner!.logoUrl ?? null) : u.image;
              return (
                <div key={u.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50">
                  <Link href={`/app/profile/${u.id}`} className="shrink-0">
                    {uDisplayImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={uDisplayImage}
                        alt={uDisplayName ?? ""}
                        className={cn("h-9 w-9 object-cover", uIsPartner ? "rounded-xl" : "rounded-full")}
                      />
                    ) : (
                      <div className={cn("h-9 w-9 flex items-center justify-center text-white text-xs font-bold select-none", uIsPartner ? "rounded-xl bg-[#2A5FA5]" : "rounded-full bg-[#0F6E56]")}>
                        {(uDisplayName ?? "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                    )}
                  </Link>
                  <Link href={`/app/profile/${u.id}`} className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate leading-tight">
                      {uDisplayName ?? "Anonymous"}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {uIsPartner ? "Migration Partner" : (u.title ?? u.company ?? "Staky member")}
                    </p>
                  </Link>
                  <SuggestedFollowButton userId={u.id} />
                </div>
              );
            })}
          </div>
          <div className="px-4 pb-3">
            <Link
              href="/app/network"
              className="flex items-center gap-1.5 text-xs font-medium text-[#0F6E56] hover:underline"
            >
              <Users className="h-3.5 w-3.5" />
              View your network
            </Link>
          </div>
        </div>
      )}

      {/* Your stack */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-900">Your stack</h3>
          <Link href="/app/my-stack" className="text-xs font-medium text-[#0F6E56] hover:underline">
            Manage
          </Link>
        </div>
        {stackSlugs.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {stackSlugs.slice(0, 8).map((slug) => (
              <div key={slug} className="flex flex-col items-center gap-1">
                <ToolIcon slug={slug} size="md" />
                <span className="text-[9px] text-gray-400 max-w-[40px] text-center truncate">
                  {TOOLS[slug]?.name}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-3 text-center">
            <Layers className="h-6 w-6 text-gray-200 mb-1.5" />
            <p className="text-[11px] text-gray-400 mb-2">Your stack is empty</p>
            <Link
              href="/app/my-stack"
              className="text-[11px] font-medium text-[#0F6E56] hover:underline"
            >
              Add tools
            </Link>
          </div>
        )}
      </div>

      {/* Trending switches */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-xs font-semibold text-gray-900 mb-0.5">Trending this week</h3>
        <p className="text-[10px] text-gray-400 mb-3">Most-switched tools in Europe</p>
        <div className="space-y-0">
          {POPULAR_SWITCHES.slice(0, 5).map((sw, i) => {
            const toTool = TOOLS[sw.to];
            return (
              <Link
                key={sw.id}
                href={`/discover?category=${encodeURIComponent(sw.category)}`}
                className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-4 px-4 transition-colors"
              >
                <span className="text-xs font-bold text-gray-300 w-4 shrink-0">{i + 1}</span>
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <ToolIcon slug={sw.from} size="sm" />
                  <ArrowRight className="h-3 w-3 text-gray-300 shrink-0" />
                  <ToolIcon slug={sw.to} size="sm" />
                  <span className="text-xs text-gray-700 truncate ml-1">{toTool?.name}</span>
                </div>
                <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                  {sw.switcherCount.toLocaleString()}
                </span>
              </Link>
            );
          })}
        </div>
        <Link
          href="/discover"
          className="mt-3 flex items-center gap-1 text-xs font-medium text-[#0F6E56] hover:underline"
        >
          <Globe className="h-3 w-3" />
          View all EU alternatives
        </Link>
      </div>

      {/* Partners CTA */}
      <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-[#0d2748] to-[#2A5FA5] p-4 text-white">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Handshake className="h-4 w-4 text-blue-200" />
          <h3 className="text-sm font-semibold">Need migration help?</h3>
        </div>
        <p className="text-xs text-blue-200 leading-relaxed mb-3">
          Connect with certified EU migration partners to guide your team.
        </p>
        <Link
          href="/partners"
          className="w-full inline-flex items-center justify-center h-8 bg-white text-[#2A5FA5] text-xs font-semibold rounded-lg hover:bg-blue-50 transition-colors"
        >
          Browse partners
        </Link>
      </div>
    </aside>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: AppFeedFilter }) {
  const messages: Record<AppFeedFilter, { title: string; desc: string; cta?: { label: string; href: string } }> = {
    all: { title: "No posts yet", desc: "Be the first to share your migration story!" },
    following: {
      title: "No posts from people you follow",
      desc: "Start following people to see their posts here.",
      cta: { label: "Find people to follow", href: "/network" },
    },
    community: { title: "No community posts yet", desc: "Be the first to share your migration story!" },
    partners: {
      title: "No partner posts yet",
      desc: "Migration partners will share expert guides here.",
      cta: { label: "Browse partners", href: "/partners" },
    },
  };
  const { title, desc, cta } = messages[filter];
  return (
    <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-xs text-gray-400 mt-1 mb-4">{desc}</p>
      {cta && (
        <Link
          href={cta.href}
          className="inline-flex items-center h-8 px-4 rounded-lg bg-[#0F6E56] text-white text-xs font-semibold hover:bg-[#0a5a45] transition-colors"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FeedClient({
  initialPosts,
  initialLikedIds,
  initialSavedIds,
  initialRecommendedIds,
  initialFollowingIds,
  initialConnectedIds,
  initialHasMore,
  initialNextCursor,
  filter,
  currentUserId,
  currentUserImage,
  userName,
  userInitials,
  isPartnerMode,
  partnerName,
  partnerLogoUrl,
  loadedAt,
  targetPostId,
  targetCommentId,
  suggestedUsers,
  stackSlugs,
}: FeedClientProps) {
  const router = useRouter();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [posts, setPosts] = useState(initialPosts);
  const [likedIds, setLikedIds] = useState(() => new Set(initialLikedIds));
  const [savedIds, setSavedIds] = useState(() => new Set(initialSavedIds));
  const [recommendedIds, setRecommendedIds] = useState(() => new Set(initialRecommendedIds));
  const [followingIds, setFollowingIds] = useState(() => new Set(initialFollowingIds));
  const [connectedIds, setConnectedIds] = useState(() => new Set(initialConnectedIds));
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [newPostCount, setNewPostCount] = useState(0);

  // ── Infinite scroll ────────────────────────────────────────────────────────

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, nextCursor]);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const result = await getAppFeedPosts({ filter, cursor: nextCursor });
      setPosts((prev) => [...prev, ...result.posts]);
      setLikedIds((prev) => new Set(Array.from(prev).concat(result.likedIds)));
      setSavedIds((prev) => new Set(Array.from(prev).concat(result.savedIds)));
      setRecommendedIds((prev) => new Set(Array.from(prev).concat(result.recommendedIds)));
      setFollowingIds((prev) => new Set(Array.from(prev).concat(result.followingIds)));
      setConnectedIds((prev) => new Set(Array.from(prev).concat(result.connectedIds)));
      setHasMore(result.hasMore);
      setNextCursor(result.nextCursor);
    } catch {
      // silently fail — user can scroll again
    } finally {
      setLoadingMore(false);
    }
  }

  // ── New posts polling (every 30 s) ─────────────────────────────────────────

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const count = await checkNewPosts({ filter, newerThan: loadedAt });
        setNewPostCount(count);
      } catch {
        // ignore polling errors
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [filter, loadedAt]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <FeedScrollHandler targetPostId={targetPostId} targetCommentId={targetCommentId} />

      <div className="mx-auto max-w-[980px]">
        <div className="grid justify-center gap-5 items-start lg:grid-cols-[minmax(0,560px)_260px]">

          {/* ── Main feed column ── */}
          <div className="min-w-0 lg:max-w-[560px]">

            {/* New posts banner */}
            {newPostCount > 0 && (
              <button
                onClick={() => router.refresh()}
                className="w-full mb-3 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#0F6E56]/30 bg-green-50 text-xs font-semibold text-[#0F6E56] hover:bg-green-100 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {newPostCount} new post{newPostCount > 1 ? "s" : ""} — click to load
              </button>
            )}

            {/* Composer */}
            <FeedComposer
              userName={userName}
              userInitials={userInitials}
              userImage={currentUserImage}
              isPartnerMode={isPartnerMode}
              partnerName={partnerName}
              partnerLogoUrl={partnerLogoUrl}
            />

            {/* Filter tabs */}
            <FilterTabs active={filter} />

            {/* Posts */}
            <div className="space-y-2.5">
              {posts.length === 0 && !loadingMore && <EmptyState filter={filter} />}

              {posts.map((post) => (
                <FeedPost
                  key={post.id}
                  post={post}
                  currentUserId={currentUserId}
                  currentUserImage={currentUserImage}
                  initialLiked={likedIds.has(post.id)}
                  initialSaved={savedIds.has(post.id)}
                  initialRecommended={recommendedIds.has(post.id)}
                  initialFollowing={followingIds.has(post.author.id)}
                  initialConnected={connectedIds.has(post.author.id)}
                  autoExpandComments={!!targetCommentId && post.id === targetPostId}
                />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            {hasMore && (
              <div ref={sentinelRef} className="flex justify-center py-6">
                {loadingMore && <Loader2 className="h-5 w-5 animate-spin text-gray-300" />}
              </div>
            )}

            {/* End of feed */}
            {!hasMore && posts.length > 0 && (
              <p className="text-center text-xs text-gray-400 py-6">
                You&apos;re all caught up
              </p>
            )}
          </div>

          {/* ── Right sidebar ── */}
          <div className="hidden lg:block sticky top-6 self-start">
            <RightSidebar suggested={suggestedUsers} stackSlugs={stackSlugs} />
          </div>
        </div>
      </div>
    </>
  );
}

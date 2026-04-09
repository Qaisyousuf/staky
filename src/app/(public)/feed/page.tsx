import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Compass,
  Handshake,
  Star,
  Users,
  LayoutDashboard,
  PenSquare,
} from "lucide-react";
import { FeedScrollHandler } from "@/components/shared/feed-scroll-handler";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FeedPost } from "@/components/shared/feed-post";
import type { FeedPostData } from "@/components/shared/feed-post";
import { ToolIcon, type DbTool } from "@/components/shared/tool-icon";
import { FeedComposer, FeedComposerGuest } from "@/components/shared/feed-composer";

export const metadata = {
  title: "Community Feed — Staky",
  description: "Real migration stories from European businesses switching to EU software.",
};

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}


// ─── Left sidebar ──────────────────────────────────────────────────────────────

async function LeftSidebar() {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const cardStyle = {
    border: "1.5px solid rgba(0,0,0,0.04)",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)",
  };

  return (
    <aside className="sticky top-6 space-y-3">
      {/* Profile card */}
      <div className="overflow-hidden rounded-[24px] bg-white" style={cardStyle}>
        <div
          className="h-16"
          style={{
            background: "linear-gradient(135deg, #0F6E56 0%, #1a9070 60%, #0d5f4a 100%)",
          }}
        />
        <div className="px-4 pb-5">
          <div className="-mt-7 mb-3">
            {isLoggedIn ? (
              session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name ?? ""}
                  className="h-14 w-14 rounded-full object-cover border-4 border-white shadow-sm"
                />
              ) : (
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#0F6E56] text-white text-base font-bold border-4 border-white shadow-sm select-none">
                  {getInitials(session.user.name)}
                </span>
              )
            ) : (
              <div className="h-14 w-14 rounded-full bg-gray-100 border-4 border-white flex items-center justify-center shadow-sm">
                <Users className="h-7 w-7 text-gray-400" />
              </div>
            )}
          </div>

          {isLoggedIn ? (
            <>
              <p className="text-sm font-semibold text-gray-900 leading-tight truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 mb-4 truncate">
                {session.user.email}
              </p>
              <Link
                href="/dashboard"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0F6E56] py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#0d5f4a]"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Go to Dashboard
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-gray-900 leading-tight">
                Join the community
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                Share migration stories and connect with other European businesses.
              </p>
              <div className="mt-4 space-y-2">
                <Link
                  href="/signup"
                  className="block w-full rounded-full bg-[#0F6E56] py-2.5 text-center text-xs font-semibold text-white transition-colors hover:bg-[#0d5f4a]"
                >
                  Join now
                </Link>
                <Link
                  href="/login"
                  className="block w-full rounded-full border border-[#ddd7ca] py-2.5 text-center text-xs font-semibold text-gray-700 transition-colors hover:bg-[#fbfaf6]"
                >
                  Sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick nav */}
      <div className="rounded-[24px] bg-white py-2" style={cardStyle}>
        <Link
          href="/discover"
          className="mx-1 flex items-center gap-3 rounded-[16px] px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-[#fbfaf6]"
        >
          <Compass className="h-4 w-4 text-gray-400" />
          Discover tools
        </Link>
        <Link
          href="/partners"
          className="mx-1 flex items-center gap-3 rounded-[16px] px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-[#fbfaf6]"
        >
          <Handshake className="h-4 w-4 text-gray-400" />
          Migration partners
        </Link>
        {isLoggedIn && (
          <Link
            href="/my-posts"
            className="mx-1 flex items-center gap-3 rounded-[16px] px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-[#fbfaf6]"
          >
            <PenSquare className="h-4 w-4 text-gray-400" />
            My posts
          </Link>
        )}
      </div>
    </aside>
  );
}

// ─── Right sidebar ─────────────────────────────────────────────────────────────

async function RightSidebar() {
  const [topAlts, topPartner] = await Promise.all([
    prisma.softwareAlternative.findMany({
      where: { published: true },
      orderBy: { switcherCount: "desc" },
      take: 5,
      include: {
        fromTool: { select: { name: true, logoUrl: true, color: true, abbr: true, country: true } },
        toTool:   { select: { name: true, logoUrl: true, color: true, abbr: true, country: true } },
      },
    }),
    prisma.partner.findFirst({
      where: { approved: true },
      orderBy: { rating: "desc" },
      select: {
        id: true, companyName: true, country: true, description: true,
        logoUrl: true, rating: true, projectCount: true,
        specialty: true,
      },
    }),
  ]);
  const cardStyle = {
    border: "1.5px solid rgba(0,0,0,0.04)",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)",
  };

  return (
    <aside className="sticky top-6 space-y-3">
      {/* Trending switches */}
      <div className="rounded-[24px] bg-white p-4" style={cardStyle}>
        <h3 className="text-xs font-semibold text-gray-900 mb-1">Trending this week</h3>
        <p className="text-[10px] text-gray-400 mb-3">Most-switched tools in Europe</p>
        <div className="space-y-2">
          {topAlts.map((alt) => (
            <Link
              key={alt.id}
              href={`/discover?category=${encodeURIComponent(alt.category)}`}
              className="flex items-center gap-3 py-1 transition-colors hover:bg-transparent"
            >
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <ToolIcon toolData={alt.fromTool} size="sm" />
                <ArrowRight className="h-3 w-3 text-gray-300 shrink-0" />
                <ToolIcon toolData={alt.toTool} size="sm" />
                <span className="text-xs text-gray-700 truncate ml-1">{alt.toTool.name}</span>
              </div>
            </Link>
          ))}
        </div>
        <Link
          href="/discover"
          className="mt-3 flex items-center gap-1 text-xs font-medium text-[#0F6E56] hover:underline"
        >
          View all alternatives
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Featured partner */}
      {topPartner && (
        <div className="rounded-[24px] bg-white p-4" style={cardStyle}>
          <div className="flex items-start gap-3 mb-3">
            {topPartner.logoUrl ? (
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                <Image
                  src={topPartner.logoUrl}
                  alt={`${topPartner.companyName} logo`}
                  width={26}
                  height={26}
                  className="h-auto w-auto max-h-[70%] max-w-[70%] object-contain"
                />
              </span>
            ) : (
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white bg-[#2A5FA5]">
                {topPartner.companyName.slice(0, 2).toUpperCase()}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 leading-tight truncate">
                {topPartner.companyName}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">{topPartner.country}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(topPartner.rating)
                      ? "text-amber-400 fill-amber-400"
                      : "text-gray-200 fill-gray-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-gray-700">{topPartner.rating.toFixed(1)}</span>
            <span className="text-[10px] text-gray-400">({topPartner.projectCount})</span>
          </div>
          {topPartner.description && (
            <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">
              {topPartner.description}
            </p>
          )}
          <div className="flex flex-wrap gap-1 mb-4">
            {(topPartner.specialty as string[]).slice(0, 3).map((spec) => (
              <span
                key={spec}
                className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-[#2A5FA5]"
              >
                {spec}
              </span>
            ))}
          </div>
          <Link
            href="/partners"
            className="block w-full text-center rounded-lg bg-[#2A5FA5] hover:bg-[#244d8a] text-white text-xs font-medium py-2 transition-colors"
          >
            Request help
          </Link>
        </div>
      )}
    </aside>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function PublicFeedPage({
  searchParams,
}: {
  searchParams: { post?: string; comment?: string; tag?: string };
}) {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const userId = session?.user?.id;
  const userName = session?.user?.name ?? "";
  const userInitials = getInitials(userName);

  // Fetch image directly from DB — not from JWT (base64 images break cookie size limits)
  let userImage: string | null = null;
  if (userId) {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { image: true } });
    userImage = u?.image ?? null;
  }

  const activeTag = searchParams.tag?.trim().toLowerCase() || undefined;

  // Fetch composer tools (all published tools, split by origin for FeedComposer dropdowns)
  const composerTools = await prisma.softwareTool.findMany({
    where: { published: true },
    select: { slug: true, name: true, origin: true, logoUrl: true, color: true, abbr: true },
    orderBy: { name: "asc" },
  });
  const composerUsTools = composerTools.filter((t) => t.origin === "us");
  const composerEuTools = composerTools.filter((t) => t.origin === "eu");

  // Fetch posts with counts
  const rawPosts = await prisma.alternativePost.findMany({
    where: {
      published: true,
      ...(activeTag ? { tags: { has: activeTag } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
          verified: true,
          title: true,
          company: true,
          partner: { select: { rating: true, projectCount: true, companyName: true, logoUrl: true } },
        },
      },
      _count: {
        select: { likes: true, recommendations: true, savedBy: true, comments: true },
      },
    },
  });

  // Fetch DB tool records for fromTool/toTool (stored as slugs) to get logo data
  const toolSlugs = Array.from(new Set(rawPosts.flatMap((p) => [p.fromTool, p.toTool])));
  const dbTools = await prisma.softwareTool.findMany({
    where: { slug: { in: toolSlugs } },
    select: { slug: true, name: true, logoUrl: true, color: true, abbr: true, country: true },
  });
  const toolBySlug = new Map<string, DbTool>(dbTools.map((t) => [t.slug, t]));

  // Per-user engagement state
  let likedSet = new Set<string>();
  let savedSet = new Set<string>();
  let recommendedSet = new Set<string>();
  let followingSet = new Set<string>();
  let connectedSet = new Set<string>();

  if (userId) {
    const postIds = rawPosts.map((p) => p.id);
    const authorIds = Array.from(new Set(rawPosts.map((p) => p.authorId)));
    const [likes, saves, recs, follows, connections] = await Promise.all([
      prisma.like.findMany({ where: { userId, postId: { in: postIds } }, select: { postId: true } }),
      prisma.savedPost.findMany({ where: { userId, postId: { in: postIds } }, select: { postId: true } }),
      prisma.recommendation.findMany({ where: { userId, postId: { in: postIds } }, select: { postId: true } }),
      prisma.follow.findMany({ where: { followerId: userId, followingId: { in: authorIds } }, select: { followingId: true } }),
      prisma.connection.findMany({
        where: { OR: [{ userId, targetId: { in: authorIds } }, { userId: { in: authorIds }, targetId: userId }] },
        select: { userId: true, targetId: true },
      }),
    ]);
    likedSet = new Set(likes.map((l) => l.postId));
    savedSet = new Set(saves.map((s) => s.postId));
    recommendedSet = new Set(recs.map((r) => r.postId));
    followingSet = new Set(follows.map((f) => f.followingId));
    connectedSet = new Set(connections.map((c) => (c.userId === userId ? c.targetId : c.userId)));
  }

  const posts: FeedPostData[] = rawPosts.map((p) => ({
    id: p.id,
    fromTool: p.fromTool,
    toTool: p.toTool,
    fromToolData: toolBySlug.get(p.fromTool) ?? null,
    toToolData: toolBySlug.get(p.toTool) ?? null,
    story: p.story,
    tags: p.tags,
    imageUrls: p.imageUrls,
    linkUrl: p.linkUrl,
    linkTitle: p.linkTitle,
    linkDescription: p.linkDescription,
    linkImage: p.linkImage,
    linkDomain: p.linkDomain,
    createdAt: p.createdAt.toISOString(),
    postedAsPartner: p.postedAsPartner,
    author: {
      id: p.author.id,
      name: p.author.name,
      image: p.author.image,
      role: p.author.role,
      verified: p.author.verified,
      title: p.author.title,
      company: p.author.company,
      partner: p.author.partner,
    },
    likeCount: p._count.likes,
    recommendCount: p._count.recommendations,
    saveCount: p._count.savedBy,
    commentCount: p._count.comments,
  }));

  return (
    <div className="bg-gray-50 min-h-screen">
      <FeedScrollHandler targetPostId={searchParams.post} targetCommentId={searchParams.comment} />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_260px] gap-5">
          <div className="hidden lg:block">
            <LeftSidebar />
          </div>

          <main className="min-w-0">
            {isLoggedIn ? (
              <FeedComposer userName={userName} userInitials={userInitials} userImage={userImage} usTools={composerUsTools} euTools={composerEuTools} />
            ) : (
              <FeedComposerGuest />
            )}
            {activeTag && (
              <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Showing posts for #{activeTag}</p>
                  <p className="text-xs text-gray-400">Hashtag filter is active for the community feed.</p>
                </div>
                <Link
                  href="/feed"
                  className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-[#0F6E56] hover:text-[#0F6E56]"
                >
                  Clear filter
                </Link>
              </div>
            )}
            <div className="space-y-3">
              {posts.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
                  <p className="text-sm font-medium text-gray-600">No posts yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {activeTag
                      ? `No posts found for #${activeTag}.`
                      : "Be the first to share your migration story!"}
                  </p>
                </div>
              )}
              {posts.map((post) => (
                <FeedPost
                  key={post.id}
                  post={post}
                  currentUserId={userId}
                  currentUserImage={userImage}
                  initialLiked={likedSet.has(post.id)}
                  initialSaved={savedSet.has(post.id)}
                  initialRecommended={recommendedSet.has(post.id)}
                  initialFollowing={followingSet.has(post.author.id)}
                  initialConnected={connectedSet.has(post.author.id)}
                  autoExpandComments={
                    !!searchParams.comment && post.id === searchParams.post
                  }
                />
              ))}
            </div>
          </main>

          <div className="hidden lg:block">
            <RightSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}

"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { FeedPostData } from "@/components/shared/feed-post";

export type AppFeedFilter = "all" | "following" | "community" | "partners";

// ─── Load posts ───────────────────────────────────────────────────────────────

export async function getAppFeedPosts({
  filter = "all",
  cursor,
  take = 20,
}: {
  filter?: AppFeedFilter;
  cursor?: string;
  take?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;

  // For "following" filter we need the followed (userId, followingMode) pairs, scoped to current mode
  // followingMode tells us which persona of theirs we follow — posts must match that persona
  let followedPairs: { followingId: string; followingMode: string }[] = [];
  if (filter === "following") {
    // Read mode from DB — JWT can lag after mode switch
    const modeRecord = await prisma.user.findUnique({ where: { id: userId }, select: { activeMode: true, partner: { select: { approved: true } } } });
    const followerMode = (modeRecord?.activeMode === "partner" && modeRecord?.partner?.approved) ? "partner" : "user";
    followedPairs = await prisma.follow.findMany({
      where: { followerId: userId, followerMode },
      select: { followingId: true, followingMode: true },
    });
  }

  // Build where clause
  // Visibility: show public + community to everyone; private only to the author
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const visibilityFilter: any = {
    OR: [
      { visibility: { in: ["public", "community"] } },
      { authorId: userId },
    ],
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { published: true, AND: [visibilityFilter] };

  if (filter === "following") {
    // Show posts from followed users only when the post persona matches the followed persona
    // postedAsPartner: true ↔ followingMode: "partner"; postedAsPartner: false ↔ followingMode: "user"
    const partnerFollowedIds = followedPairs.filter((p) => p.followingMode === "partner").map((p) => p.followingId);
    const userFollowedIds    = followedPairs.filter((p) => p.followingMode === "user").map((p) => p.followingId);
    const followingOR = [
      ...(partnerFollowedIds.length > 0 ? [{ authorId: { in: partnerFollowedIds }, postedAsPartner: true }] : []),
      ...(userFollowedIds.length    > 0 ? [{ authorId: { in: userFollowedIds },    postedAsPartner: false }] : []),
    ];
    // If nothing to show, force empty result
    where.AND.push({ OR: followingOR.length > 0 ? followingOR : [{ id: "__none__" }] });
  }
  if (filter === "community") where.author = { role: { not: "PARTNER" } };
  if (filter === "partners") where.author = { role: "PARTNER" };

  const rawPosts = await prisma.alternativePost.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
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

  if (rawPosts.length === 0) {
    return {
      posts: [] as FeedPostData[],
      likedIds: [] as string[],
      savedIds: [] as string[],
      recommendedIds: [] as string[],
      followingIds: [] as string[], // compound keys: "userId:personaMode"
      connectedIds: [] as string[], // compound keys: "userId:personaMode"
      hasMore: false,
      nextCursor: undefined as string | undefined,
    };
  }

  const postIds = rawPosts.map((p) => p.id);
  const authorIds = Array.from(new Set(rawPosts.map((p) => p.authorId)));
  // Always read from DB — JWT activeMode can lag after a mode switch
  const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { activeMode: true } });
  const activeMode = dbUser?.activeMode ?? "user";

  // Fetch DB tool records for fromTool/toTool (stored as slugs) to get logo data
  const toolSlugs = Array.from(new Set(rawPosts.flatMap((p) => [p.fromTool, p.toTool])));
  const dbTools = await prisma.softwareTool.findMany({
    where: { slug: { in: toolSlugs } },
    select: { slug: true, name: true, logoUrl: true, color: true, abbr: true, country: true },
  });
  const toolBySlug = new Map(dbTools.map((t) => [t.slug, t]));

  const [likes, saves, recs, follows, connections] = await Promise.all([
    prisma.like.findMany({ where: { userId, postId: { in: postIds }, senderMode: activeMode }, select: { postId: true } }),
    prisma.savedPost.findMany({ where: { userId, postId: { in: postIds }, senderMode: activeMode }, select: { postId: true } }),
    prisma.recommendation.findMany({ where: { userId, postId: { in: postIds }, senderMode: activeMode }, select: { postId: true } }),
    // Only count follows made from the current mode persona
    prisma.follow.findMany({ where: { followerId: userId, followerMode: activeMode, followingId: { in: authorIds } }, select: { followingId: true, followingMode: true } }),
    // Only count connections made from the current mode persona
    prisma.connection.findMany({
      where: { OR: [{ userId, requesterMode: activeMode, targetId: { in: authorIds } }, { userId: { in: authorIds }, targetId: userId }] },
      select: { userId: true, targetId: true, targetMode: true, requesterMode: true },
    }),
  ]);

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

  // Build persona-aware compound keys: "userId:personaMode"
  // followingIds uses followingMode (which persona of theirs we follow)
  const connectedKeys = connections.map((c) => {
    const isRequester = c.userId === userId;
    const otherId = isRequester ? c.targetId : c.userId;
    // personaMode of the OTHER user in this connection
    const personaMode = isRequester ? c.targetMode : c.requesterMode;
    return `${otherId}:${personaMode}`;
  });

  return {
    posts,
    likedIds: likes.map((l) => l.postId),
    savedIds: saves.map((s) => s.postId),
    recommendedIds: recs.map((r) => r.postId),
    followingIds: follows.map((f) => `${f.followingId}:${f.followingMode}`),
    connectedIds: connectedKeys,
    hasMore: rawPosts.length === take,
    nextCursor: rawPosts.length === take ? rawPosts[rawPosts.length - 1].id : undefined,
  };
}

// ─── Check for new posts ───────────────────────────────────────────────────────

export async function checkNewPosts({
  filter,
  newerThan,
}: {
  filter: AppFeedFilter;
  newerThan: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return 0;
  const userId = session.user.id;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    published: true,
    createdAt: { gt: new Date(newerThan) },
    AND: [{ OR: [{ visibility: { in: ["public", "community"] } }, { authorId: userId }] }],
  };

  if (filter === "following") {
    const modeRecord = await prisma.user.findUnique({ where: { id: userId }, select: { activeMode: true, partner: { select: { approved: true } } } });
    const followerMode = (modeRecord?.activeMode === "partner" && modeRecord?.partner?.approved) ? "partner" : "user";
    const rows = await prisma.follow.findMany({
      where: { followerId: userId, followerMode },
      select: { followingId: true, followingMode: true },
    });
    const partnerIds = rows.filter((r) => r.followingMode === "partner").map((r) => r.followingId);
    const userIds    = rows.filter((r) => r.followingMode === "user").map((r) => r.followingId);
    const followingOR = [
      ...(partnerIds.length > 0 ? [{ authorId: { in: partnerIds }, postedAsPartner: true }] : []),
      ...(userIds.length    > 0 ? [{ authorId: { in: userIds },    postedAsPartner: false }] : []),
    ];
    if (followingOR.length === 0) return 0;
    where.AND.push({ OR: followingOR });
  } else if (filter === "community") {
    where.author = { role: { not: "PARTNER" } };
  } else if (filter === "partners") {
    where.author = { role: "PARTNER" };
  }

  return prisma.alternativePost.count({ where });
}

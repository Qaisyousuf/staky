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

  // For "following" filter we need the followed user IDs up front
  let followedIds: string[] = [];
  if (filter === "following") {
    const rows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    followedIds = rows.map((r) => r.followingId);
  }

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { published: true };
  if (filter === "following") where.authorId = { in: followedIds };
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
          partner: { select: { rating: true, projectCount: true } },
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
      followingIds: [] as string[],
      hasMore: false,
      nextCursor: undefined as string | undefined,
    };
  }

  const postIds = rawPosts.map((p) => p.id);
  const authorIds = Array.from(new Set(rawPosts.map((p) => p.authorId)));

  const [likes, saves, recs, follows] = await Promise.all([
    prisma.like.findMany({ where: { userId, postId: { in: postIds } }, select: { postId: true } }),
    prisma.savedPost.findMany({ where: { userId, postId: { in: postIds } }, select: { postId: true } }),
    prisma.recommendation.findMany({ where: { userId, postId: { in: postIds } }, select: { postId: true } }),
    prisma.follow.findMany({ where: { followerId: userId, followingId: { in: authorIds } }, select: { followingId: true } }),
  ]);

  const posts: FeedPostData[] = rawPosts.map((p) => ({
    id: p.id,
    fromTool: p.fromTool,
    toTool: p.toTool,
    story: p.story,
    tags: p.tags,
    imageUrls: p.imageUrls,
    linkUrl: p.linkUrl,
    linkTitle: p.linkTitle,
    linkDescription: p.linkDescription,
    linkImage: p.linkImage,
    linkDomain: p.linkDomain,
    createdAt: p.createdAt.toISOString(),
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

  return {
    posts,
    likedIds: likes.map((l) => l.postId),
    savedIds: saves.map((s) => s.postId),
    recommendedIds: recs.map((r) => r.postId),
    followingIds: follows.map((f) => f.followingId),
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
  };

  if (filter === "following") {
    const rows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    where.authorId = { in: rows.map((r) => r.followingId) };
  } else if (filter === "community") {
    where.author = { role: { not: "PARTNER" } };
  } else if (filter === "partners") {
    where.author = { role: "PARTNER" };
  }

  return prisma.alternativePost.count({ where });
}
